# Open Researcher - Technical Architecture

## Overview

Open Researcher is an AI-powered web research application that combines Firecrawl's web scraping capabilities with Anthropic's Claude AI for intelligent search, analysis, and synthesis of web content. The application uses a streaming architecture to provide real-time visibility into the AI's reasoning process.

**Version**: 0.1.0
**Framework**: Next.js 15.3.4 with App Router
**Language**: TypeScript 5.x
**AI Model**: Claude Opus 4 (claude-opus-4-20250514)

---

## 1. System Architecture Diagram (Text)

```
+--------------------+
|     Browser        |
|  (React Client)    |
+--------------------+
         |
         | HTTP/SSE
         v
+--------------------+     +----------------------+
|   Next.js App      |     |   External Services  |
|   (API Routes)     |     +----------------------+
|                    |              |
| /api/open-         |-------->  Anthropic API
|   researcher       |           (Claude Opus 4)
|                    |              |
| /api/scrape        |-------->  Firecrawl API
|                    |           (Web Scraping)
| /api/follow-up     |
|                    |
| /api/check-env     |
+--------------------+
         |
         | Server Components
         v
+--------------------+
|   React Frontend   |
|   - ThinkingChat   |
|   - SearchResults  |
|   - MarkdownRender |
+--------------------+
```

### Layered Architecture View

```
+------------------------------------------------------------------+
|                     PRESENTATION LAYER                            |
|  +--------------------+  +----------------------+                  |
|  | Page Components    |  | UI Components        |                  |
|  | - page.tsx         |  | - Button, Input      |                  |
|  | - layout.tsx       |  | - Dialog, Tooltip    |                  |
|  +--------------------+  +----------------------+                  |
|                                                                   |
|  +--------------------+  +----------------------+                  |
|  | Feature Components |  | Display Components   |                  |
|  | - ThinkingChat     |  | - MarkdownRenderer   |                  |
|  | - OpenResearcher   |  | - CitationTooltip    |                  |
|  |   Content          |  | - SearchResults      |                  |
|  +--------------------+  +----------------------+                  |
+------------------------------------------------------------------+
                              |
                              | State Management (React useState)
                              | Event Streaming (SSE)
                              v
+------------------------------------------------------------------+
|                       API LAYER (Next.js Routes)                  |
|  +--------------------+  +----------------------+                  |
|  | /api/open-         |  | /api/scrape          |                  |
|  |   researcher       |  | Direct Firecrawl     |                  |
|  | Main research      |  | scraping endpoint    |                  |
|  | endpoint (SSE)     |  +----------------------+                  |
|  +--------------------+                                            |
|                          +----------------------+                  |
|  +--------------------+  | /api/check-env       |                  |
|  | /api/follow-up     |  | Environment status   |                  |
|  | Generate follow-up |  | verification         |                  |
|  | questions          |  +----------------------+                  |
|  +--------------------+                                            |
+------------------------------------------------------------------+
                              |
                              | Service Integration
                              v
+------------------------------------------------------------------+
|                      SERVICE LAYER                                |
|  +--------------------------------------------------------+      |
|  |              open-researcher-agent.ts                   |      |
|  |  - Tool definitions (web_search, deep_scrape, analyze) |      |
|  |  - Tool execution logic                                 |      |
|  |  - Streaming event callback system                      |      |
|  |  - Recursive response processing                        |      |
|  +--------------------------------------------------------+      |
+------------------------------------------------------------------+
                              |
                              | External API Calls
                              v
+------------------------------------------------------------------+
|                   EXTERNAL SERVICES                               |
|  +--------------------+  +----------------------+                  |
|  | Anthropic API      |  | Firecrawl API        |                  |
|  | - Claude Opus 4    |  | - Web Search         |                  |
|  | - Interleaved      |  | - URL Scraping       |                  |
|  |   Thinking Beta    |  | - Screenshot Capture |                  |
|  | - Tool Use         |  +----------------------+                  |
|  +--------------------+                                            |
+------------------------------------------------------------------+
```

---

## 2. Component Relationships

### Frontend Component Hierarchy

```
RootLayout (app/layout.tsx)
    |
    +-- Toaster (sonner) [Global notifications]
    |
    +-- OpenResearcherPage (app/open-researcher/page.tsx)
            |
            +-- OpenResearcherContent (open-researcher-content.tsx)
                    |
                    +-- Header
                    |   +-- Firecrawl Logo (Link)
                    |   +-- GitHub Button
                    |
                    +-- Hero Section (conditional)
                    |
                    +-- ThinkingChat (components/thinking-chat.tsx)
                    |       |
                    |       +-- Message List
                    |       |   +-- User Messages (styled bubbles)
                    |       |   +-- Assistant Messages
                    |       |       +-- ThinkingEvent displays
                    |       |       +-- MarkdownRenderer
                    |       |       +-- CitationTooltip
                    |       |
                    |       +-- SearchResultsDisplay
                    |       |   +-- Browser URL Bar
                    |       |   +-- Search Results List
                    |       |   +-- Screenshot Viewer
                    |       |   +-- AnimatedCursor
                    |       |
                    |       +-- Input Form
                    |           +-- Query Input
                    |           +-- Submit Button
                    |
                    +-- Footer
                    |
                    +-- API Key Dialog (conditional)
                        +-- Input for Firecrawl key
                        +-- Validation logic
```

### Backend Service Relationships

```
API Route: /api/open-researcher/route.ts
    |
    +-- Validates request (query, API keys)
    |
    +-- Creates SSE stream
    |
    +-- Calls performResearchWithStreaming()
            |
            +-- open-researcher-agent.ts
                    |
                    +-- Anthropic Client (lazy init)
                    |   +-- Claude Opus 4 with interleaved thinking
                    |   +-- Tool definitions passed
                    |
                    +-- Firecrawl Client (lazy init)
                    |
                    +-- Tool Executors:
                        +-- executeWebSearch()
                        |   +-- Firecrawl search API
                        |   +-- Query analysis for intent
                        |   +-- Optional content scraping
                        |
                        +-- executeDeepScrape()
                        |   +-- Firecrawl scrapeUrl API
                        |   +-- Link filtering and following
                        |   +-- Screenshot capture
                        |
                        +-- analyzeContent()
                            +-- Sentiment analysis
                            +-- Key facts extraction
                            +-- Trend identification
                            +-- Credibility assessment
```

### Data Type Relationships

```typescript
// Core message structure
Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    searchData?: {
        status: 'searching' | 'complete' | 'error'
        events: ThinkingEvent[]
    }
    sources?: Array<{url, title, description}>
}

// Streaming event types
ThinkingEvent {
    type: 'start' | 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'summary'
    timestamp?: number
    content?: string           // For thinking blocks
    number?: number            // Block/call number
    tool?: string              // Tool name
    parameters?: Record<...>   // Tool input
    result?: string            // Tool output
    screenshots?: Array<...>   // Captured screenshots
    duration?: number          // Execution time
}

// Search result structure
SearchResult {
    title: string
    url: string
    description?: string
    markdown?: string
    screenshot?: string
    dateFound?: string
}
```

---

## 3. Data Flow Description

### Primary Research Flow

```
1. USER INPUT
   User enters query in ThinkingChat input
                |
                v
2. CLIENT-SIDE VALIDATION
   - Check if Firecrawl API key available
   - If not: show API key modal
   - Create user message in state
                |
                v
3. HTTP POST to /api/open-researcher
   Headers: { 'X-Firecrawl-API-Key': key }
   Body: { query: string }
                |
                v
4. SERVER-SIDE VALIDATION
   - Verify ANTHROPIC_API_KEY in env
   - Get Firecrawl key (header or env)
                |
                v
5. SSE STREAM INITIALIZATION
   - Create ReadableStream
   - Set up event encoder
                |
                v
6. RESEARCH EXECUTION (performResearchWithStreaming)
   +-------------------------------------------+
   |                                           |
   |  a) Initialize Anthropic client           |
   |     Model: claude-opus-4-20250514         |
   |     Beta: interleaved-thinking-2025-05-14 |
   |                                           |
   |  b) Send initial message to Claude        |
   |     - System prompt (research assistant)  |
   |     - User query                          |
   |     - Tool definitions                    |
   |                                           |
   |  c) Process response recursively:         |
   |                                           |
   |     THINKING BLOCK:                       |
   |     - Emit 'thinking' event via SSE       |
   |     - Add to assistant content            |
   |                                           |
   |     TOOL USE:                             |
   |     - Emit 'tool_call' event              |
   |     - Execute tool (web_search/deep_      |
   |       scrape/analyze_content)             |
   |     - Emit 'tool_result' event            |
   |     - Include screenshots if available    |
   |     - Continue conversation with result   |
   |                                           |
   |     TEXT:                                 |
   |     - Emit 'response' event               |
   |     - Set as final response               |
   |                                           |
   |  d) Emit 'summary' event                  |
   |                                           |
   +-------------------------------------------+
                |
                v
7. CLIENT-SIDE SSE PROCESSING
   - Parse incoming events
   - Update message state with events
   - Extract search results from tool_result
   - Update screenshots array
   - Display thinking blocks in UI
                |
                v
8. FINAL DISPLAY
   - Render final markdown response
   - Show citation tooltips
   - Display search results panel
   - Show captured screenshots
```

### Tool Execution Flow (web_search)

```
executeWebSearch(query, limit, scrapeContent, tbs)
                |
                v
1. METADATA SEARCH (Step 1)
   firecrawl.search(query, { formats: [] })
   - Returns titles, URLs, descriptions
   - No content scraping yet
                |
                v
2. QUERY INTENT ANALYSIS
   Detect signals:
   - wantsRecent: /latest|recent|newest/
   - wantsBlog: /blog|post|article/
   - wantsDocs: /documentation|docs|api/
   - hasTimeFilter: !!tbs
   - hasSiteFilter: /site:/
                |
                v
3. CONDITIONAL SCRAPING (Step 2)
   If scrapeContent=true:
   - Filter URLs based on intent
   - Re-search with formats: ["markdown"]
   - Extract dates from content
   - Capture screenshots
                |
                v
4. RESULT FORMATTING
   Return {
       content: formatted string,
       screenshots: [{url, screenshot}]
   }
```

### Tool Execution Flow (deep_scrape)

```
executeDeepScrape(sourceUrl, linkFilter, maxDepth, maxLinks, formats)
                |
                v
1. SOURCE PAGE SCRAPE
   firecrawl.scrapeUrl(sourceUrl, {
       formats: ['markdown', 'links', 'screenshot@fullPage']
   })
                |
                v
2. LINK EXTRACTION (if linkFilter provided)
   - Get all links from source
   - Apply regex filter
   - Limit to maxLinks
                |
                v
3. PARALLEL LINK SCRAPING
   Promise.all(links.map(link =>
       firecrawl.scrapeUrl(link, {formats})
   ))
                |
                v
4. RESULT AGGREGATION
   - Combine source content
   - Add link content previews
   - Include all screenshots
```

---

## 4. API Contracts

### POST /api/open-researcher

Primary research endpoint with Server-Sent Events streaming.

**Request:**
```typescript
POST /api/open-researcher
Content-Type: application/json
X-Firecrawl-API-Key?: string  // Optional, falls back to env

{
    "query": string  // Research query (required)
}
```

**Response (SSE Stream):**
```typescript
// Content-Type: text/event-stream

// Event types sent via SSE:
data: { type: 'event', event: ThinkingEvent }
data: { type: 'response', content: string }
data: { type: 'done' }
data: { type: 'error', error: string, originalError?: string }

// ThinkingEvent shapes:
{
    type: 'start',
    query: string,
    timestamp: number
}

{
    type: 'thinking',
    number: number,
    content: string,
    timestamp: number
}

{
    type: 'tool_call',
    number: number,
    tool: 'firecrawl_search' | 'firecrawl_scrape' | 'analyze_content',
    parameters: {
        query?: string,
        source_url?: string,
        // ... other tool-specific params
    },
    timestamp: number
}

{
    type: 'tool_result',
    tool: string,
    duration: number,
    result: string,
    screenshots?: Array<{ url: string, screenshot?: string }>,
    timestamp: number
}

{
    type: 'response',
    content: string,
    timestamp: number
}

{
    type: 'summary',
    thinkingBlocks: number,
    toolCalls: number,
    timestamp: number
}
```

**Error Responses:**
```typescript
// 400 Bad Request
{ error: 'Query is required' }

// 500 Internal Server Error
{ error: 'ANTHROPIC_API_KEY is not configured...' }
{ error: 'FIRECRAWL_API_KEY is not configured...' }
{ error: 'Internal server error', message: string, hint: string }
```

---

### POST /api/open-researcher/follow-up

Generate follow-up questions based on a completed query.

**Request:**
```typescript
POST /api/open-researcher/follow-up
Content-Type: application/json

{
    "query": string  // Original research query (required)
}
```

**Response:**
```typescript
// 200 OK
{
    "questions": string[]  // Array of 5 follow-up questions
}

// Empty fallback
{
    "questions": []
}
```

**Error Responses:**
```typescript
// 400 Bad Request
{ error: 'Query is required' }

// 500 Internal Server Error
{ error: 'ANTHROPIC_API_KEY is not configured' }
{ error: 'Failed to generate follow-up questions' }
```

**Implementation Notes:**
- Uses Claude 3 Haiku (claude-3-haiku-20240307) for fast generation
- Temperature: 0.7 for varied suggestions
- Max tokens: 300

---

### POST /api/scrape

Direct Firecrawl scraping endpoint for API key validation and direct scraping.

**Request:**
```typescript
POST /api/scrape
Content-Type: application/json
X-Firecrawl-API-Key?: string  // Optional, falls back to env

// Single URL scraping
{
    "url": string,
    // ... additional Firecrawl params
}

// Batch URL scraping
{
    "urls": string[],
    // ... additional Firecrawl params
}
```

**Response:**
```typescript
// Success
{
    "success": true,
    "data": {
        "url"?: string,
        "markdown"?: string,
        "links"?: string[],
        "screenshot"?: string,
        "metadata"?: {
            "title"?: string,
            "description"?: string
        }
    }
}

// Error
{
    "success": false,
    "error": string
}
```

---

### GET /api/check-env

Environment status verification endpoint.

**Request:**
```typescript
GET /api/check-env
```

**Response:**
```typescript
{
    "environmentStatus": {
        "FIRECRAWL_API_KEY": boolean,      // true if set
        "ANTHROPIC_API_KEY": boolean,      // true if set
        "FIRESTARTER_DISABLE_CREATION_DASHBOARD": boolean
    },
    // Development mode only:
    "anthropicKeyPrefix"?: string,  // First 10 chars + "..."
    "firecrawlKeyPrefix"?: string,
    "nodeEnv"?: string
}
```

---

## 5. External Dependencies Map

### Production Dependencies

| Package | Version | Purpose | Used In |
|---------|---------|---------|---------|
| `@anthropic-ai/sdk` | ^0.54.0 | Claude AI API client | `lib/open-researcher-agent.ts`, `app/api/*/route.ts` |
| `@mendable/firecrawl-js` | ^1.25.1 | Web scraping and search | `lib/open-researcher-agent.ts`, `app/api/scrape/route.ts` |
| `next` | 15.3.4 | React framework with App Router | Entire application |
| `react` | ^19.0.0 | UI library | All components |
| `react-dom` | ^19.0.0 | React DOM rendering | Application entry |
| `ai` | ^4.3.16 | Vercel AI SDK (available but not actively used) | - |
| `@radix-ui/react-dialog` | ^1.1.14 | Modal dialog component | API key modal |
| `@radix-ui/react-slot` | ^1.2.3 | Component composition | UI primitives |
| `@radix-ui/react-tooltip` | ^1.2.7 | Tooltip component | Citation tooltips |
| `class-variance-authority` | ^0.7.1 | Variant-based styling | UI components |
| `clsx` | ^2.1.1 | Conditional class names | All components |
| `tailwind-merge` | ^3.3.0 | Tailwind class merging | `lib/utils.ts` |
| `tailwindcss-animate` | ^1.0.7 | Animation utilities | CSS animations |
| `lucide-react` | ^0.511.0 | Icon library | All components |
| `react-markdown` | ^10.1.0 | Markdown rendering (available) | - |
| `remark-gfm` | ^4.0.1 | GFM markdown support | - |
| `sonner` | ^2.0.3 | Toast notifications | `app/layout.tsx` |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Type checking |
| `@types/node` | ^20 | Node.js type definitions |
| `@types/react` | ^19 | React type definitions |
| `@types/react-dom` | ^19 | React DOM type definitions |
| `tailwindcss` | ^4 | CSS framework |
| `@tailwindcss/postcss` | ^4 | PostCSS integration |
| `eslint` | ^9 | Code linting |
| `eslint-config-next` | 15.3.4 | Next.js ESLint config |
| `@eslint/eslintrc` | ^3 | ESLint configuration |

### External Service Dependencies

```
+------------------+     +-------------------+
|   Anthropic API  |     |   Firecrawl API   |
+------------------+     +-------------------+
| Endpoint:        |     | Endpoint:         |
| api.anthropic.   |     | api.firecrawl.dev |
| com              |     |                   |
+------------------+     +-------------------+
| Auth:            |     | Auth:             |
| Bearer token     |     | API key           |
| (env var)        |     | (env/header)      |
+------------------+     +-------------------+
| Features Used:   |     | Features Used:    |
| - Messages API   |     | - Search API      |
| - Tool use       |     | - Scrape URL      |
| - Interleaved    |     | - Batch scrape    |
|   thinking beta  |     | - Screenshots     |
| - Streaming      |     |                   |
+------------------+     +-------------------+
| Models:          |     | Rate Limits:      |
| - claude-opus-4  |     | Per API key       |
|   -20250514      |     |                   |
| - claude-3-      |     |                   |
|   haiku-20240307 |     |                   |
+------------------+     +-------------------+
```

---

## 6. Key Design Decisions

### 1. Streaming Architecture with SSE

**Decision**: Use Server-Sent Events (SSE) for real-time research progress updates.

**Rationale**:
- Provides real-time visibility into AI reasoning process
- Users can see thinking blocks as they happen
- Tool calls and results stream incrementally
- Better UX than waiting for complete response
- Native browser support without WebSocket complexity

**Implementation**:
- `ReadableStream` creates SSE response
- Events encoded as `data: JSON\n\n` format
- Client parses with `EventSource`-like pattern

---

### 2. Interleaved Thinking with Tool Use

**Decision**: Use Anthropic's interleaved thinking beta feature.

**Rationale**:
- Shows AI's reasoning process transparently
- Thinking blocks appear between tool calls
- Users understand how conclusions are reached
- Builds trust in AI responses
- Enables debugging of research process

**Trade-offs**:
- Beta feature may change
- Requires special API access
- Higher token usage than standard responses

---

### 3. Two-Step Search Strategy

**Decision**: Separate metadata fetch from content scraping.

**Rationale**:
- Fast initial results display
- Intelligent scraping decisions based on metadata
- Query intent analysis determines which URLs to scrape
- Reduces unnecessary API calls
- Better performance for simple queries

**Implementation**:
```typescript
// Step 1: Metadata only
const metadataResults = await firecrawl.search(query, {
    scrapeOptions: { formats: [] }
});

// Step 2: Selective scraping
if (scrapeContent) {
    const urlsToScrape = filterByIntent(metadataResults);
    const scrapedResults = await firecrawl.search(query, {
        scrapeOptions: { formats: ["markdown"] }
    });
}
```

---

### 4. Lazy Client Initialization

**Decision**: Initialize Anthropic and Firecrawl clients lazily.

**Rationale**:
- Vercel deployment compatibility
- Environment variables available at runtime
- No startup cost for unused features
- Singleton pattern prevents multiple instances

**Implementation**:
```typescript
let anthropic: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
    if (!anthropic) {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) throw new Error('...');
        anthropic = new Anthropic({ apiKey });
    }
    return anthropic;
}
```

---

### 5. Client-Side API Key Storage

**Decision**: Allow Firecrawl API key input via UI with localStorage persistence.

**Rationale**:
- Users can provide their own Firecrawl keys
- Keys persist across sessions
- Validation against actual API
- Reduces server-side configuration burden
- Development flexibility

**Security Consideration**:
- Keys stored in localStorage (client-side only)
- Sent via `X-Firecrawl-API-Key` header
- Never logged or persisted server-side

---

### 6. Split View UI Pattern

**Decision**: Side-by-side chat and search results display.

**Rationale**:
- Chat interface for conversation flow
- Search results panel for source visibility
- Screenshot viewer for scraped pages
- Progressive disclosure of information
- Responsive collapse on mobile

**Implementation**:
- Flex layout with `lg:flex-row`
- Conditional width classes
- Animation for transitions
- Scroll synchronization

---

### 7. Tool-Based Architecture

**Decision**: Define AI capabilities as discrete tools.

**Rationale**:
- Clear separation of concerns
- Easy to add new capabilities
- Anthropic tool use API compatibility
- Testable individual functions
- Documented interfaces

**Tools Defined**:
1. `web_search` - Firecrawl search with optional scraping
2. `deep_scrape` - Single URL deep analysis with link following
3. `analyze_content` - Content analysis (sentiment, facts, trends)

---

### 8. Recursive Response Processing

**Decision**: Process Claude responses recursively for multi-turn tool use.

**Rationale**:
- Claude may need multiple tool calls
- Each tool result can trigger more thinking
- Natural conversation flow maintained
- State accumulated across iterations

**Flow**:
```
Initial Query -> Claude Response
    |
    +-> Thinking Block -> Continue
    +-> Tool Use -> Execute -> Tool Result -> Continue
    +-> Text -> Final Response
```

---

### 9. Custom Markdown Renderer

**Decision**: Implement custom markdown parser instead of using react-markdown directly.

**Rationale**:
- Lightweight for common patterns
- Citation support `[1]` as superscripts
- Table rendering with Tailwind styles
- Link handling for external URLs
- Streaming compatibility

**Supported Features**:
- Headers (h1-h3)
- Bold and italic
- Lists (ordered/unordered)
- Code blocks and inline code
- Tables
- Links
- Citations

---

### 10. Screenshot-Based Visual Feedback

**Decision**: Capture and display full-page screenshots during scraping.

**Rationale**:
- Visual confirmation of scraped pages
- Users see what AI is analyzing
- Debugging aid for scraping issues
- Enhanced trust and transparency

**Implementation**:
- Firecrawl `screenshot@fullPage` format
- Base64-encoded images in response
- Animated scroll for long screenshots
- Gallery view for multiple captures

---

## Environment Configuration

### Required Environment Variables

```bash
# Anthropic API Key (Required)
ANTHROPIC_API_KEY=sk-ant-...

# Firecrawl API Key (Optional - can be provided via UI)
FIRECRAWL_API_KEY=fc-...
```

### Optional Configuration

```bash
# Disable creation dashboard feature
FIRESTARTER_DISABLE_CREATION_DASHBOARD=true

# Node environment
NODE_ENV=development|production
```

---

## File Structure Reference

```
open-researcher/
|-- app/
|   |-- api/
|   |   |-- check-env/
|   |   |   +-- route.ts          # Environment status endpoint
|   |   |-- open-researcher/
|   |   |   |-- follow-up/
|   |   |   |   +-- route.ts      # Follow-up questions endpoint
|   |   |   +-- route.ts          # Main research endpoint (SSE)
|   |   +-- scrape/
|   |       +-- route.ts          # Direct Firecrawl scraping
|   |-- open-researcher/
|   |   |-- open-researcher-content.tsx  # Main page content
|   |   +-- page.tsx              # Page wrapper with metadata
|   |-- favicon.ico
|   |-- globals.css               # Global styles
|   |-- layout.tsx                # Root layout with Toaster
|   +-- page.tsx                  # Root redirect/landing
|
|-- components/
|   |-- ui/                       # shadcn/ui components
|   |   |-- button.tsx
|   |   |-- dialog.tsx
|   |   |-- input.tsx
|   |   |-- tooltip.tsx
|   |   +-- ... (40+ UI components)
|   |-- animated-cursor.tsx       # Browser close animation
|   |-- citation-tooltip.tsx      # Source citation display
|   |-- markdown-renderer.tsx     # Custom markdown parser
|   |-- screenshot-preview.tsx    # Screenshot display
|   |-- search-results-display.tsx # Browser-like results view
|   |-- thinking-chat.tsx         # Main chat interface
|   +-- thinking-display.tsx      # Thinking block renderer
|
|-- lib/
|   |-- open-researcher-agent.ts  # Core AI agent logic
|   +-- utils.ts                  # Utility functions (cn)
|
|-- public/
|   |-- firecrawl-logo-with-fire.png
|   +-- ... (other static assets)
|
|-- docs/
|   +-- TECHNICAL_ARCHITECTURE.md # This document
|
|-- .env.local.example            # Environment template
|-- eslint.config.mjs             # ESLint configuration
|-- next.config.ts                # Next.js configuration
|-- package.json                  # Dependencies and scripts
|-- tailwind.config.ts            # Tailwind CSS configuration
|-- tsconfig.json                 # TypeScript configuration
+-- README.md                     # Project documentation
```

---

## Performance Considerations

### Client-Side
- React 19 with automatic batching
- Memoized markdown rendering
- Lazy loading of screenshots
- Efficient SSE parsing
- Debounced input handling

### Server-Side
- Lazy API client initialization
- Parallel link scraping in deep_scrape
- Streaming responses (no buffering)
- Efficient regex patterns for parsing

### Network
- SSE for incremental updates
- Compressed responses
- CDN-friendly static assets
- API key caching (localStorage)

---

## Security Considerations

1. **API Key Protection**
   - Server-side keys via environment variables
   - Client-provided keys via headers only
   - No logging of API keys

2. **Input Validation**
   - Query required check
   - API key presence verification
   - URL validation in scraping

3. **Output Sanitization**
   - Markdown rendering without XSS vectors
   - Safe link handling (noopener, noreferrer)

4. **Error Handling**
   - Generic error messages in production
   - Detailed errors only in development
   - No stack traces to client

---

*Document generated: January 2026*
*Last updated: Based on codebase analysis*
