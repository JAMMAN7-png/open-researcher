# Open Researcher - Architecture Overview

## System Architecture

This document provides a high-level overview of the Open Researcher application architecture, focusing on the key components and their interactions.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────┐
                                    │           Client Browser            │
                                    │  ┌─────────────────────────────────┐│
                                    │  │     Next.js App (React 19)      ││
                                    │  │  ┌───────────┐ ┌─────────────┐  ││
                                    │  │  │ThinkingChat│ │SearchResults│  ││
                                    │  │  └───────────┘ └─────────────┘  ││
                                    │  │  ┌───────────┐ ┌─────────────┐  ││
                                    │  │  │MarkdownRen│ │MotionProvider│ ││
                                    │  │  └───────────┘ └─────────────┘  ││
                                    │  └─────────────────────────────────┘│
                                    └───────────────────┬─────────────────┘
                                                        │ SSE Stream
                                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           Next.js API Routes                              │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ /api/check-env  │  │ /api/scrape      │  │ /api/open-researcher    │  │
│  │ Environment     │  │ Firecrawl proxy  │  │ Main research endpoint  │  │
│  │ validation      │  │                  │  │ + /follow-up            │  │
│  └─────────────────┘  └──────────────────┘  └────────────┬────────────┘  │
└──────────────────────────────────────────────────────────┼────────────────┘
                                                           │
                                                           ▼
                              ┌─────────────────────────────────────────────┐
                              │       Open Researcher Agent                 │
                              │  ┌─────────────────────────────────────┐   │
                              │  │  performResearchWithStreaming()      │   │
                              │  │  - System prompt                     │   │
                              │  │  - Tool definitions                  │   │
                              │  │  - Response processing               │   │
                              │  └─────────────────────────────────────┘   │
                              │  ┌─────────────────────────────────────┐   │
                              │  │  Tool Execution                      │   │
                              │  │  - web_search                        │   │
                              │  │  - deep_scrape                       │   │
                              │  │  - analyze_content                   │   │
                              │  └─────────────────────────────────────┘   │
                              └───────────────┬─────────────────────────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
                     ▼                        ▼                        ▼
          ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
          │  Anthropic API  │     │  Firecrawl API  │     │ Pattern-based   │
          │  Claude Opus 4  │     │  Web Scraping   │     │ Analysis        │
          │  + Interleaved  │     │  + Screenshots  │     │                 │
          │    Thinking     │     │                 │     │                 │
          └─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Core Components

### 1. Frontend Layer

**Technology**: Next.js 15 with React 19, TypeScript, Tailwind CSS 4

| Component | File | Purpose |
|-----------|------|---------|
| `ThinkingChat` | `components/thinking-chat.tsx` | Main chat interface, SSE handling |
| `SearchResultsDisplay` | `components/search-results-display.tsx` | Browser-style results UI |
| `ThinkingDisplay` | `components/thinking-display.tsx` | Real-time thinking visualization |
| `MarkdownRenderer` | `components/markdown-renderer.tsx` | Response formatting with citations |
| `MotionProvider` | `components/motion-provider.tsx` | LazyMotion animation provider |
| `CitationTooltip` | `components/citation-tooltip.tsx` | Source attribution tooltips |
| `ScreenshotPreview` | `components/screenshot-preview.tsx` | Page screenshot display |

### 2. API Layer

**Technology**: Next.js API Routes (Serverless Functions)

| Route | Purpose | Response Type |
|-------|---------|---------------|
| `/api/open-researcher` | Main research endpoint | Server-Sent Events (SSE) |
| `/api/open-researcher/follow-up` | Generate follow-up questions | JSON |
| `/api/scrape` | Direct Firecrawl proxy | JSON |
| `/api/check-env` | Environment validation | JSON |

### 3. Agent Layer

**Technology**: Anthropic Claude SDK with Interleaved Thinking

**Core Functions**:
- `performResearchWithStreaming()` - Main streaming research function
- `performResearch()` - Non-streaming research function
- `executeTool()` - Tool dispatcher
- `executeWebSearch()` - Search with smart scraping
- `executeDeepScrape()` - Recursive URL scraping
- `analyzeContent()` - Pattern-based content analysis

### 4. External Services

| Service | Purpose | SDK |
|---------|---------|-----|
| Anthropic Claude | AI reasoning and response generation | `@anthropic-ai/sdk` |
| Firecrawl | Web scraping and search | `@mendable/firecrawl-js` |

## Data Flow

### Research Request Flow

```
1. User Input
   └─> ThinkingChat.handleSearch()
       └─> POST /api/open-researcher
           └─> performResearchWithStreaming()
               └─> Anthropic Claude API (with tools)
                   └─> Tool Calls (web_search, deep_scrape, analyze_content)
                       └─> Firecrawl API / Pattern Analysis
                           └─> Tool Results
                               └─> Claude Response
                                   └─> SSE Events
                                       └─> Frontend State Updates
                                           └─> UI Renders
```

### Event Types

| Event | Description | Contains |
|-------|-------------|----------|
| `start` | Research initiated | Query |
| `thinking` | AI reasoning block | Thinking content, number |
| `tool_call` | Tool invocation | Tool name, parameters |
| `tool_result` | Tool result | Content, screenshots |
| `response` | Final response | Markdown content |
| `done` | Stream complete | - |
| `error` | Error occurred | Error message |

## State Management

### Frontend State (React useState)

```typescript
// ThinkingChat component state
messages: Message[]           // Chat history
searchResults: SearchResult[] // Current search results
screenshots: Screenshot[]     // Captured page screenshots
currentQuery: string          // Active search query
currentScrapingUrl: string    // URL being scraped
isSearching: boolean          // Loading state
```

### Data Persistence

- **API Keys**: `localStorage` (user-provided Firecrawl key)
- **Session State**: In-memory (React state)
- **No Server-side Persistence**: Stateless API routes

## Security Considerations

### API Key Management

```
Environment Variables (Server)
├── ANTHROPIC_API_KEY (required) - Server-side only
└── FIRECRAWL_API_KEY (optional) - Server-side or UI-provided

Client Storage
└── localStorage: Firecrawl API key (user-provided)
    └── Transmitted via X-Firecrawl-API-Key header
```

### Input Validation

- Query sanitization (length limits)
- URL validation for scraping
- API key format validation

## Performance Optimizations

### Frontend

- **LazyMotion**: Optimized animation bundle (~4.6KB)
- **Turbopack**: Fast development builds
- **CSS Animations**: GPU-accelerated transforms
- **Memoized Components**: Reduce unnecessary re-renders

### Backend

- **SSE Streaming**: Progressive disclosure reduces perceived latency
- **Lazy Client Initialization**: SDK clients created on first use
- **Smart Scraping**: Intent-based filtering reduces API calls

## File Organization

```
open-researcher/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── open-researcher/   # Main page
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Shadcn/UI (50+ components)
│   └── *.tsx             # Feature components
├── lib/                   # Business logic
│   ├── open-researcher-agent.ts  # Core agent
│   └── utils.ts           # Utilities
├── tests/                 # Playwright tests
│   ├── e2e/              # Test files
│   └── pages/            # Page objects
├── docs/                  # Documentation
└── public/                # Static assets
```

## Technology Decisions

### Why Next.js 15?

- Server-Side Rendering for SEO
- API Routes for serverless functions
- App Router for modern routing
- Built-in TypeScript support
- Turbopack for fast development

### Why Claude Opus 4?

- Advanced reasoning capabilities
- Interleaved thinking beta feature
- Tool use for structured interactions
- High-quality text generation

### Why Firecrawl?

- Reliable web scraping
- Screenshot capture
- Link extraction
- Search functionality
- Google operators support

### Why Zustand?

- Minimal boilerplate
- TypeScript support
- No providers needed
- Middleware support
- Small bundle size

### Why React Hook Form + Zod?

- Performant form handling (minimizes re-renders)
- Type-safe validation
- Schema-first approach
- Great DX with resolvers

### Why Playwright?

- Cross-browser testing
- Mobile viewport testing
- Network interception
- Visual regression
- Accessibility testing integration

## Related Documentation

- [Research Flow](./RESEARCH_FLOW.md) - Detailed research workflow
- [Technical Architecture](./TECHNICAL_ARCHITECTURE.md) - Component details
- [UX Documentation](./UX-DOCUMENTATION.md) - User experience
- [Visual Design System](./VISUAL_DESIGN_SYSTEM.md) - Design tokens
- [CLAUDE.md](../CLAUDE.md) - Full technical reference
