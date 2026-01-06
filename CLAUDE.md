# Open Researcher - Technical Documentation

## Project Overview

**Open Researcher** is an AI-powered web research assistant that combines Firecrawl's web scraping capabilities with Anthropic's Claude AI to perform intelligent, interactive research tasks. The application features real-time thinking visualization, advanced web scraping, and a split-view interface that shows both the research process and results.

### Core Purpose
- Enable users to conduct deep web research through natural language queries
- Visualize AI reasoning and decision-making in real-time
- Provide comprehensive web scraping with screenshot capture
- Support follow-up questions for iterative research

### Key Capabilities
- **Intelligent Web Search**: Powered by Firecrawl with Google search operators support
- **Deep Web Scraping**: Extract content from pages and follow links with filtering
- **Content Analysis**: Sentiment analysis, key facts extraction, trend identification
- **Real-Time Thinking Display**: Claude's interleaved thinking exposed to users
- **Screenshot Capture**: Visual verification of scraped pages
- **Citation Tracking**: Automatic source attribution with hover tooltips

---

## Technology Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with dark mode support
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering with GitHub Flavored Markdown (remark-gfm)

### Backend/API
- **Anthropic Claude SDK** (v0.54.0) - AI model integration
  - Model: `claude-opus-4-20250514`
  - Beta Feature: `interleaved-thinking-2025-05-14`
- **Firecrawl JS** (v1.25.1) - Web scraping and search
- **Next.js API Routes** - Serverless API endpoints

### State Management & Forms
- **Zustand** (v5.0.9) - Lightweight state management
- **React Hook Form** (v7.70.0) - Performant form handling
- **Zod** (v3.25.76) - TypeScript-first schema validation
- **@hookform/resolvers** (v5.2.2) - Zod integration for react-hook-form

### Animation
- **Motion** (framer-motion) - React animation library
- **LazyMotion** - Optimized bundle (~4.6KB) via domAnimation feature

### Development & Testing
- **Turbopack** - Fast development bundler
- **ESLint 9** - Code linting
- **PostCSS** - CSS processing
- **Playwright** (v1.57.0) - E2E testing framework
- **@axe-core/playwright** (v4.11.0) - Accessibility testing

---

## Architecture Overview

### Application Structure

```
open-researcher/
├── app/
│   ├── api/                      # API Routes (Next.js serverless functions)
│   │   ├── check-env/           # Environment variable validation
│   │   ├── open-researcher/     # Main research endpoint
│   │   │   ├── route.ts         # Streaming research API
│   │   │   └── follow-up/       # Follow-up question generation
│   │   └── scrape/              # Direct Firecrawl proxy
│   ├── open-researcher/         # Main application page
│   │   ├── page.tsx             # Route entry point
│   │   └── open-researcher-content.tsx  # Main UI component
│   ├── favicon.ico
│   ├── globals.css              # Global styles and animations
│   └── layout.tsx               # Root layout with metadata
│
├── components/
│   ├── ui/                      # Shadcn/UI components (50+ components)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── tooltip.tsx
│   │   └── ...
│   ├── animated-cursor.tsx      # Cursor animation for browser close
│   ├── citation-tooltip.tsx     # Source citation hover component
│   ├── markdown-renderer.tsx    # Markdown display with syntax highlighting
│   ├── motion-provider.tsx      # LazyMotion provider for animations
│   ├── screenshot-preview.tsx   # Screenshot thumbnail/viewer
│   ├── search-results-display.tsx  # Google-style search results UI
│   ├── thinking-chat.tsx        # Main chat interface with split view
│   └── thinking-display.tsx     # Real-time thinking process visualization
│
├── lib/
│   ├── open-researcher-agent.ts # Core AI agent logic and tool execution
│   └── utils.ts                 # Utility functions (cn for classNames)
│
├── public/                      # Static assets
│   └── firecrawl-logo-with-fire.png
│
├── tests/                       # Playwright E2E tests
│   ├── e2e/                    # End-to-end test files
│   ├── fixtures/               # Test fixtures
│   └── pages/                  # Page object models
│       ├── home.page.ts        # Home page interactions
│       ├── chat.page.ts        # Chat interface interactions
│       └── api-key-modal.page.ts # API key modal interactions
│
├── docs/                        # Documentation
│   ├── RESEARCH_FLOW.md        # Research workflow documentation
│   ├── TECHNICAL_ARCHITECTURE.md # Architecture overview
│   ├── UX-DOCUMENTATION.md     # User experience documentation
│   └── VISUAL_DESIGN_SYSTEM.md # Visual design system reference
│
├── Configuration Files
├── .env.local                   # Environment variables (create from example)
├── .env.local.example          # Environment variable template
├── .gitignore
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── playwright.config.ts         # Playwright E2E test configuration
└── eslint.config.mjs
```

---

## Setup Instructions

### Prerequisites
- **Node.js 18+** and npm/pnpm
- **Anthropic API Key** (required) - [Get here](https://console.anthropic.com/)
- **Firecrawl API Key** (optional, can be added via UI) - [Get here](https://www.firecrawl.dev/)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/mendableai/open-researcher
   cd open-researcher
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:
   ```env
   # Required - Anthropic Claude API for AI functionality
   ANTHROPIC_API_KEY=sk-ant-...

   # Optional - Firecrawl for web scraping (can be added via UI)
   FIRECRAWL_API_KEY=fc-...
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000)

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables Reference

| Variable | Required | Purpose | Where to Get |
|----------|----------|---------|--------------|
| `ANTHROPIC_API_KEY` | Yes | Powers Claude AI reasoning and responses | [Anthropic Console](https://console.anthropic.com/) |
| `FIRECRAWL_API_KEY` | No* | Enables web scraping and search | [Firecrawl](https://www.firecrawl.dev/) |

*If not set in environment, users can provide it through the UI, stored in localStorage.

---

## Research Workflow & Data Flow

### Complete Research Flow

```
User Query → Chat Interface → API Endpoint → Research Agent → Tools → Results
                                                    ↓
                                            Thinking Process
                                                    ↓
                                    ┌───────────────┴───────────────┐
                                    ↓                               ↓
                            Tool Selection                   Content Analysis
                                    ↓                               ↓
                ┌──────────────────┴──────────────────┐
                ↓                   ↓                  ↓
          web_search          deep_scrape      analyze_content
                ↓                   ↓                  ↓
           Firecrawl           Firecrawl         Pattern Matching
                ↓                   ↓                  ↓
         Search Results      Scraped Content    Analysis Results
                ↓                   ↓                  ↓
           Screenshots         Screenshots       Insights/Facts
                └───────────────────┴──────────────────┘
                                    ↓
                          Streaming to Frontend
                                    ↓
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Thinking Display              Search Results Display
                    ↓                               ↓
              Chat Interface                  Browser UI
```

### Step-by-Step Process

1. **User Input Phase**
   - User enters query in chat input
   - Frontend validates Firecrawl API key availability
   - Query sent to `/api/open-researcher` via POST

2. **Research Initiation**
   - API route creates Server-Sent Events (SSE) stream
   - Calls `performResearchWithStreaming()` from agent
   - Claude receives query with system prompt and tool definitions

3. **AI Reasoning Loop**
   - Claude generates thinking blocks (exposed via beta feature)
   - Decides which tools to use based on query intent
   - Emits events: `thinking`, `tool_call`, `tool_result`
   - Events streamed to frontend in real-time

4. **Tool Execution**
   - **web_search**: Firecrawl search → metadata → optional content scraping
   - **deep_scrape**: URL scraping → link extraction → recursive scraping
   - **analyze_content**: Pattern-based analysis (sentiment, trends, facts)
   - Screenshots captured during scraping

5. **Result Processing**
   - Tool results parsed and formatted
   - Screenshots base64-encoded and sent with results
   - Search results displayed in Google-style UI
   - Citations extracted and linked

6. **Response Generation**
   - Claude synthesizes final answer from tool results
   - Markdown-formatted response with citations
   - Streaming completes with `done` event

---

## Core Components

### 1. Research Agent (`lib/open-researcher-agent.ts`)

**Purpose**: Core AI orchestration and tool execution engine.

**Key Functions**:

#### `performResearchWithStreaming(query, onEvent)`
- Main entry point for research requests
- Uses Claude Opus 4 with interleaved thinking beta
- Streams events via callback: `start`, `thinking`, `tool_call`, `tool_result`, `response`, `summary`
- Handles recursive conversation turns until completion

**Parameters**:
```typescript
query: string           // User's research question
onEvent: (event) => void  // Callback for streaming events
```

**Returns**: Final response string

#### `executeTool(toolName, input)`
- Dispatches to appropriate tool handler
- Returns `{ content: string, screenshots?: Array<{url, screenshot}> }`

**Available Tools**:

1. **web_search**
   - Two-phase approach: metadata search → selective content scraping
   - Smart filtering based on query intent signals
   - Supports Google operators (`site:`, `intitle:`) and time filters (`tbs`)
   - Parameters:
     ```typescript
     {
       query: string
       limit?: number (default: 5)
       scrape_content?: boolean (default: false)
       tbs?: "qdr:h" | "qdr:d" | "qdr:w" | "qdr:m" | "qdr:y"
     }
     ```

2. **deep_scrape**
   - Scrapes source URL for content and links
   - Optionally follows filtered links (regex pattern)
   - Captures screenshots with `@fullPage` modifier
   - Parameters:
     ```typescript
     {
       source_url: string
       link_filter?: string (regex)
       max_depth?: number (default: 1)
       max_links?: number (default: 5)
       formats?: string[] (default: ["markdown"])
     }
     ```

3. **analyze_content**
   - Pattern-based content analysis
   - Types: sentiment, key_facts, trends, summary, credibility
   - Parameters:
     ```typescript
     {
       content: string
       analysis_type: "sentiment" | "key_facts" | "trends" | "summary" | "credibility"
       context?: string
     }
     ```

#### Helper Functions

- `getAnthropicClient()`: Lazy-initialized Anthropic SDK client
- `getFirecrawlClient()`: Lazy-initialized Firecrawl SDK client
- `executeWebSearch()`: Implements intelligent search with scraping logic
- `executeDeepScrape()`: Handles recursive URL scraping
- `analyzeContent()`: Performs keyword-based content analysis

**System Prompt Strategy**:
- Instructs Claude on blog post position counting (newest = 1st)
- Emphasizes methodical verification of blog post ordering
- Guides tool usage patterns (search first, then scrape specific URLs)

---

### 2. Main Chat Interface (`components/thinking-chat.tsx`)

**Purpose**: Primary user interaction component with split-view layout.

**Features**:
- Chat history with user/assistant messages
- Real-time thinking process display
- Search results in Google-style browser UI
- Screenshot preview with scanning animation
- Responsive mobile/desktop layouts

**State Management**:
```typescript
messages: Message[]              // Chat history
searchResults: SearchResult[]   // Current search results
screenshots: Screenshot[]       // Captured page screenshots
currentQuery: string            // Active search query
currentScrapingUrl: string      // URL being scraped (shows screenshot)
isSearching: boolean            // Loading state
```

**Key Methods**:

#### `handleSearch(query)`
1. Validates Firecrawl API key availability
2. Creates user message in chat
3. Initiates streaming request to `/api/open-researcher`
4. Parses SSE stream for events
5. Updates UI based on event types
6. Handles errors with user-friendly messages

#### `parseSearchResults(resultText)`
- Extracts search results from tool result text
- Parses format: `[index] Title\nURL: ...\nDescription: ...`
- Returns structured array of results

**Responsive Behavior**:
- Mobile: Stacked layout (results top, chat bottom)
- Desktop: Side-by-side (chat left, browser right)
- Browser panel can close to show chat full-width

---

### 3. Search Results Display (`components/search-results-display.tsx`)

**Purpose**: Google-style search results with browser chrome.

**Features**:
- Fake browser URL bar with traffic light buttons
- Google-style search result cards
- Screenshot viewer with auto-scroll for long pages
- Animated cursor for browser close action
- Search history tracking

**View Modes**:
- `search`: Default search results view
- `screenshots`: Gallery of all captured screenshots
- `history`: Previous search sessions

**Screenshot Display Logic**:
```typescript
// Shows screenshot when:
isActive && currentUrl && screenshots.length > 0

// Auto-scrolling for tall screenshots:
isImageTall && "animate-screenshot-scroll"

// Scanner overlay effect for visual feedback
```

**URL Bar States**:
- Idle: Globe icon, empty text
- Searching: Search icon, "Searching: {query}", blue pulse
- Scraping: FileText icon, current URL, orange pulse

---

### 4. API Routes

#### `/api/open-researcher` (POST)
**Purpose**: Main streaming research endpoint.

**Request**:
```typescript
{
  query: string
}
```

**Headers**:
- `X-Firecrawl-API-Key`: Optional Firecrawl key from UI

**Response**: Server-Sent Events (SSE)
```typescript
// Event format
data: {"type": "event", "event": { ... }}

// Event types
- start: Research initiated
- thinking: AI reasoning block
- tool_call: Tool invocation with parameters
- tool_result: Tool execution result + screenshots
- response: Final markdown response
- done: Stream complete
- error: Error occurred
```

**Error Handling**:
- Model availability errors
- Beta feature access errors
- Authentication failures
- Detailed logging in development mode

#### `/api/open-researcher/follow-up` (POST)
**Purpose**: Generate follow-up questions using Claude Haiku.

**Request**:
```typescript
{
  query: string
}
```

**Response**:
```typescript
{
  questions: string[]  // Array of 5 follow-up questions
}
```

#### `/api/scrape` (POST)
**Purpose**: Direct Firecrawl API proxy for URL scraping.

**Request**:
```typescript
{
  url?: string           // Single URL
  urls?: string[]        // Batch URLs
  ...params             // Firecrawl options
}
```

**Response**: Firecrawl scrape result
```typescript
{
  success: boolean
  data?: { markdown, links, screenshot, metadata }
  error?: string
}
```

#### `/api/check-env` (GET)
**Purpose**: Validate environment variable configuration.

**Response**:
```typescript
{
  environmentStatus: {
    ANTHROPIC_API_KEY: boolean
    FIRECRAWL_API_KEY: boolean
  }
}
```

---

## Key Features Implementation

### Interleaved Thinking Visualization

**How It Works**:
1. Claude Opus 4 generates thinking blocks during processing
2. Beta feature `interleaved-thinking-2025-05-14` exposes internal reasoning
3. Thinking blocks streamed to frontend via SSE
4. Displayed in chat with blue dot indicator
5. Each block numbered and timestamped

**Code Pattern**:
```typescript
// Agent request
{
  model: "claude-opus-4-20250514",
  thinking: {
    type: "enabled",
    budget_tokens: 20000
  },
  betas: ["interleaved-thinking-2025-05-14"]
}

// Response handling
for (const block of response.content) {
  if (block.type === 'thinking') {
    onEvent({ type: 'thinking', content: block.thinking, number: ++count })
  }
}
```

### Smart Search Result Scraping

**Intent Detection**:
```typescript
const querySignals = {
  wantsRecent: /latest|recent|newest/.test(query),
  wantsBlog: /blog|post|article/.test(query),
  wantsDocs: /documentation|docs|guide/.test(query),
  hasTimeFilter: !!tbs,
  hasSiteFilter: /site:/.test(query)
}
```

**Filtering Logic**:
- Time-sensitive queries: Include all results (already filtered by search)
- Blog-specific: Filter by URL path patterns (`/blog/`, `/post/`)
- Documentation: Filter for docs patterns (`/docs/`, `/api/`, `/guide/`)
- Default: Top 3-5 results

**Date Extraction**:
- Scans first 1000 chars of markdown + metadata
- Regex patterns: `June 12, 2025`, `2025-06-12`, `6/12/2025`, etc.
- Sorts time-sensitive results by extracted date (newest first)

### Screenshot Capture & Display

**Capture**:
```typescript
// Request screenshot with scraping
const result = await firecrawl.scrapeUrl(url, {
  formats: ['markdown', 'links', 'screenshot@fullPage']
})

// Screenshot returned as base64 data URL
result.screenshot  // "data:image/png;base64,..."
```

**Display Features**:
- Auto-detect image height vs container
- Auto-scroll animation for tall screenshots (CSS animation)
- Scanner line overlay effect
- Grid overlay with orange accent
- Scanning badge with pulsing dots
- Fade gradients top/bottom for smooth scroll

**CSS Animation**:
```css
@keyframes screenshot-scroll {
  0%, 10% { transform: translateY(0); }
  90%, 100% { transform: translateY(calc(-100% + 100vh)); }
}
```

### Citation Tracking

**Extraction**:
- Search results include URL, title, description
- Stored in message.sources array
- Persists through conversation

**Display**:
- Inline citations in markdown: `[1]`, `[2]`
- Hover tooltip shows source details
- CitationTooltip component with Radix Tooltip

---

## Code Patterns & Conventions

### TypeScript Patterns

**Interface Naming**:
```typescript
// Props interfaces: ComponentNameProps
interface ThinkingChatProps { ... }

// Data models: Descriptive noun
interface Message { ... }
interface SearchResult { ... }

// API responses: Descriptive with suffix
interface FirecrawlSearchResult { ... }
```

**Type Safety**:
```typescript
// Explicit types for complex data
const messages: Array<{ role: string; content: string | Array<...> }> = []

// Type guards for API responses
if (content.type !== 'text') throw new Error(...)

// as assertions for SDK type mismatches
(result as FirecrawlScrapeResult).data
```

### Component Patterns

**State Management**:
```typescript
// Descriptive boolean states
const [isSearching, setIsSearching] = useState(false)
const [showSuggestions, setShowSuggestions] = useState(false)

// Arrays for collections
const [messages, setMessages] = useState<Message[]>([])

// Update patterns
setMessages(prev => [...prev, newMessage])
setMessages(prev => prev.map(msg => msg.id === id ? updated : msg))
```

**Effect Hooks**:
```typescript
// Auto-scroll on messages change
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])

// Cleanup timers
useEffect(() => {
  const timer = setTimeout(...)
  return () => clearTimeout(timer)
}, [dependency])
```

### Styling Conventions

**Tailwind Composition**:
```typescript
import { cn } from '@/lib/utils'

// Conditional classes
className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === 'primary' ? 'primary-classes' : 'secondary-classes'
)}
```

**Responsive Design**:
```typescript
// Mobile-first with lg: breakpoint
className="h-[45vh] lg:h-full lg:w-1/2"

// Hidden on mobile, shown on desktop
className="hidden lg:inline"

// Responsive padding/spacing
className="px-4 lg:px-6 py-2 lg:py-3"
```

**Dark Mode**:
```typescript
// Dark mode variants
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"

// Dark mode with hover states
className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
```

### Error Handling

**API Routes**:
```typescript
try {
  // Operation
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  // User-friendly messages
  let userFriendlyError = errorMessage
  if (errorMessage.includes('Model error')) {
    userFriendlyError = 'The Anthropic model is not available...'
  }

  // Stream error to client
  const errorData = `data: ${JSON.stringify({ type: 'error', error: userFriendlyError })}\n\n`
}
```

**Frontend**:
```typescript
try {
  const response = await fetch(...)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || errorData.message)
  }
} catch (error) {
  let errorMessage = 'Default error message'
  if (error instanceof Error) {
    // Pattern match for specific errors
    if (error.message.includes('ANTHROPIC_API_KEY')) { ... }
  }
  // Update UI with error
}
```

---

## Form Validation Patterns

### React Hook Form with Zod

The project uses react-hook-form with Zod for type-safe form validation:

**Form Component Structure**:
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// Define schema
const formSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').startsWith('fc-', 'API key must start with fc-'),
  query: z.string().min(3, 'Query must be at least 3 characters'),
})

type FormData = z.infer<typeof formSchema>

export function MyForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: '',
      query: '',
    },
  })

  async function onSubmit(data: FormData) {
    // Handle submission
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="apiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API Key</FormLabel>
              <FormControl>
                <Input placeholder="fc-..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

**Available Form Components** (from `components/ui/form.tsx`):
- `Form` - Form provider wrapper
- `FormField` - Field controller
- `FormItem` - Field container
- `FormLabel` - Field label
- `FormControl` - Input wrapper
- `FormDescription` - Helper text
- `FormMessage` - Error message display
- `useFormField` - Hook for accessing field state

---

## Animation Patterns

### LazyMotion Provider

The application uses Motion's LazyMotion for optimized bundle size (~4.6KB):

**Provider Setup** (in `components/motion-provider.tsx`):
```typescript
'use client'

import { LazyMotion, domAnimation } from 'motion/react'
import { ReactNode } from 'react'

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  )
}
```

**Using Motion Components**:
```typescript
import { m } from 'motion/react'

// Wrap with MotionProvider in layout.tsx, then use:
<m.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</m.div>
```

### CSS Animation Classes

The project includes custom CSS animations in `globals.css`:

| Animation Class | Effect | Duration |
|-----------------|--------|----------|
| `animate-fade-up` | Fade in + translate up | 500ms |
| `animate-fade-in` | Fade in | 500ms |
| `animate-slide-up` | Slide up from bottom | 700ms |
| `animate-slide-in-right` | Slide in from right | 500ms |
| `animate-scale-in-content` | Scale in with fade | 500ms |
| `animate-scan` | Scanner line animation | 3s infinite |
| `animate-selection-pulse` | Orange pulsing border | 1.5s infinite |
| `animate-selection-pulse-green` | Green pulsing border | 1.5s infinite |
| `animate-screenshot-scroll` | Tall screenshot scroll | 40s |

**Animation Timing Variables**:
```css
:root {
  --d-1: 150ms;  /* Short duration */
  --d-2: 300ms;  /* Medium duration */
  --d-3: 500ms;  /* Standard duration */
  --d-4: 700ms;  /* Long duration */
  --d-5: 1000ms; /* Extended duration */

  --t-1: 100ms;  /* Short delay */
  --t-2: 200ms;  /* Medium delay */
  --t-3: 300ms;  /* Standard delay */
  --t-4: 400ms;  /* Long delay */
  --t-5: 500ms;  /* Extended delay */
}
```

---

## Testing

### E2E Testing with Playwright

**Test Configuration** (`playwright.config.ts`):
- Test directory: `./tests/e2e`
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Auto-starts dev server before tests

**Running Tests**:
```bash
# Run all tests
npm run test:e2e

# Run tests in specific browser
npx playwright test --project=chromium

# Run tests in headed mode
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# View test report
npx playwright show-report
```

**Page Object Model Pattern**:

The project uses Page Object Model for maintainable tests:

```typescript
// tests/pages/home.page.ts
import { type Page, type Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /open researcher/i });
    this.searchInput = page.getByPlaceholder(/enter query/i);
    this.submitButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async typeQuery(query: string) {
    await this.searchInput.fill(query);
  }

  async submitSearch() {
    await this.submitButton.click();
  }
}
```

**Writing Tests**:
```typescript
// tests/e2e/home.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display heading', async () => {
    await expect(homePage.heading).toBeVisible();
  });

  test('should allow search input', async () => {
    await homePage.typeQuery('test query');
    await expect(homePage.searchInput).toHaveValue('test query');
  });
});
```

**Accessibility Testing with Axe**:
```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

---

## Extension Guide

### Adding a New Research Tool

1. **Define tool schema in `lib/open-researcher-agent.ts`**:
```typescript
const tools: ToolDefinition[] = [
  {
    name: "my_new_tool",
    description: "What this tool does and when to use it",
    input_schema: {
      type: "object",
      properties: {
        param1: { type: "string", description: "..." },
        param2: { type: "number", description: "...", default: 10 }
      },
      required: ["param1"]
    }
  },
  ...existingTools
]
```

2. **Implement tool execution function**:
```typescript
async function executeMyNewTool(
  param1: string,
  param2: number = 10
): Promise<{ content: string; screenshots?: Array<{url: string; screenshot?: string}> }> {
  try {
    // Tool logic here
    const result = await someApiCall(param1, param2)

    return {
      content: formatResultAsString(result),
      screenshots: [] // Optional screenshots
    }
  } catch (error) {
    return {
      content: `Error: ${error.message}`
    }
  }
}
```

3. **Add to tool dispatcher**:
```typescript
export async function executeTool(toolName: string, input: Record<string, unknown>) {
  switch (toolName) {
    case 'my_new_tool':
      return await executeMyNewTool(
        input.param1 as string,
        (input.param2 as number) || 10
      )
    // ...existing cases
  }
}
```

4. **Update system prompt if needed**:
```typescript
const systemPrompt = `You are a research assistant with access to:
- web_search: Search and scrape web content
- deep_scrape: Scrape pages and follow links
- analyze_content: Analyze text content
- my_new_tool: New capability description  // Add this

When to use my_new_tool:
- Specific use case 1
- Specific use case 2
`
```

5. **Add tool display name in components**:
```typescript
// In thinking-display.tsx
const toolNames: Record<string, string> = {
  web_search: 'Web Search',
  my_new_tool: 'My New Tool Name',
  ...
}
```

### Adding a New UI Component

1. **Create component in `components/`**:
```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  data: string
  onAction?: () => void
  className?: string
}

export function MyComponent({ data, onAction, className }: MyComponentProps) {
  const [isActive, setIsActive] = useState(false)

  return (
    <div className={cn(
      "base-classes",
      isActive && "active-classes",
      className
    )}>
      {/* Component content */}
    </div>
  )
}
```

2. **Import and use in parent component**:
```typescript
import { MyComponent } from '@/components/my-component'

// In component
<MyComponent
  data={someData}
  onAction={handleAction}
  className="custom-classes"
/>
```

### Adding Event Streaming to New Features

1. **Define event type**:
```typescript
// In thinking-display.tsx or create new types file
export interface MyNewEvent extends ThinkingEvent {
  type: 'my_new_event'
  customData?: string
}
```

2. **Emit event in agent**:
```typescript
// In performResearchWithStreaming
onEvent({
  type: 'my_new_event',
  customData: 'some value',
  timestamp: Date.now()
})
```

3. **Handle event in frontend**:
```typescript
// In thinking-chat.tsx SSE parsing
if (data.type === 'event') {
  events.push(data.event)

  if (data.event.type === 'my_new_event') {
    // Handle new event type
    setCustomState(data.event.customData)
  }
}
```

4. **Display in UI**:
```typescript
// In thinking-display.tsx
if (event.type === 'my_new_event') {
  return (
    <div className="custom-event-style">
      {event.customData}
    </div>
  )
}
```

---

## Troubleshooting

### Common Issues

**1. "ANTHROPIC_API_KEY is not configured"**
- Verify `.env.local` exists and contains valid key
- Restart dev server after adding environment variables
- Check key format: starts with `sk-ant-`

**2. "Model error: claude-opus-4 not available"**
- Model may not be available in your region
- Check API tier - Opus 4 requires appropriate access level
- Verify API key has beta feature access

**3. "Beta feature error: interleaved-thinking not enabled"**
- Contact Anthropic support to enable beta feature on your account
- This is a preview feature with limited availability

**4. Firecrawl API key not working**
- Validate key format: starts with `fc-`
- Test key directly via `/api/scrape` endpoint
- Check Firecrawl account credits/limits

**5. Screenshots not appearing**
- Ensure Firecrawl API key is valid
- Check browser console for base64 decode errors
- Verify screenshot data is included in tool results

**6. Search results not scraping content**
- Verify `scrape_content: true` parameter
- Check Firecrawl rate limits
- Review query intent signals in console logs

**7. Dark mode not working**
- Check Tailwind config includes dark mode strategy
- Verify dark: prefixes on class names
- Test with browser/system dark mode settings

### Debugging Tools

**Enable verbose logging**:
```typescript
// In lib/open-researcher-agent.ts
console.log('Search query:', query)
console.log('Firecrawl results:', results)
console.log('Tool execution:', { toolName, input, result })
```

**Inspect SSE stream**:
```typescript
// In thinking-chat.tsx
console.log('SSE event received:', data)
console.log('Parsed search results:', parsedResults)
```

**Monitor API calls**:
- Open browser DevTools → Network tab
- Filter for `open-researcher` and `scrape` endpoints
- Inspect request/response bodies and status codes

**Check environment**:
```bash
# Verify Node.js version
node --version  # Should be 18+

# Check installed packages
npm list @anthropic-ai/sdk
npm list @mendable/firecrawl-js
```

---

## Performance Optimization

### Frontend Optimizations

**Code Splitting**:
- All pages use `'use client'` directive for client components
- UI components lazy-loaded via dynamic imports (future enhancement)

**State Management**:
- Avoid unnecessary re-renders with `useMemo` and `useCallback`
- Debounce input handlers for search suggestions

**Animation Performance**:
- CSS animations over JavaScript
- `will-change` property for smooth transitions
- RequestAnimationFrame for custom animations

### Backend Optimizations

**Streaming**:
- Server-Sent Events reduce perceived latency
- Progressive disclosure of thinking and results
- Client receives updates as they're generated

**API Route Caching**:
```typescript
// Add to next.config.ts for static responses
export const revalidate = 3600 // Cache for 1 hour
```

**Lazy Client Initialization**:
```typescript
// Anthropic and Firecrawl clients created on first use
let anthropic: Anthropic | null = null
function getAnthropicClient() {
  if (!anthropic) anthropic = new Anthropic({ apiKey })
  return anthropic
}
```

---

## Security Considerations

### API Key Management

**Environment Variables**:
- Never commit `.env.local` to version control
- Use `.env.local.example` for documentation
- Rotate keys regularly

**Frontend Storage**:
- Firecrawl API key stored in localStorage (user-provided)
- Sent via headers, not URL parameters
- Cleared on logout/error

**API Route Protection**:
```typescript
// Validate API keys before processing
if (!process.env.ANTHROPIC_API_KEY) {
  return NextResponse.json({ error: 'Not configured' }, { status: 500 })
}

// Sanitize user input
const sanitizedQuery = query.trim().substring(0, 1000)
```

### Content Security

**XSS Prevention**:
- React automatically escapes content
- Markdown rendered via react-markdown (safe by default)
- No `dangerouslySetInnerHTML` used

**CORS**:
- API routes only accessible from same origin
- Next.js handles CORS by default

**Rate Limiting**:
- Implement on production deployment
- Use Vercel Edge Config or Redis for distributed rate limiting

---

## Testing Strategy

### Unit Testing (Future Enhancement)

**Test Framework Setup**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Example Test**:
```typescript
// __tests__/lib/open-researcher-agent.test.ts
import { executeTool } from '@/lib/open-researcher-agent'

describe('executeTool', () => {
  it('should execute web_search with valid params', async () => {
    const result = await executeTool('web_search', {
      query: 'test query',
      limit: 3
    })

    expect(result).toHaveProperty('content')
    expect(typeof result.content).toBe('string')
  })
})
```

### Integration Testing

**Test API Routes**:
```typescript
// __tests__/api/open-researcher.test.ts
import { POST } from '@/app/api/open-researcher/route'

describe('/api/open-researcher', () => {
  it('should stream research events', async () => {
    const request = new Request('http://localhost:3000/api/open-researcher', {
      method: 'POST',
      body: JSON.stringify({ query: 'test' })
    })

    const response = await POST(request)
    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
  })
})
```

### Manual Testing Checklist

- [ ] Basic search query returns results
- [ ] Thinking blocks display in real-time
- [ ] Screenshots captured and displayed
- [ ] Citations linked to sources
- [ ] Dark mode toggle works
- [ ] Mobile responsive layout
- [ ] Error handling shows user-friendly messages
- [ ] API key modal validation
- [ ] Follow-up questions generated
- [ ] Browser close animation completes

---

## Deployment

### Vercel Deployment (Recommended)

1. **Push to GitHub**:
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add `ANTHROPIC_API_KEY` (required)
   - Optionally add `FIRECRAWL_API_KEY`
   - Variables apply to Production, Preview, Development

4. **Deploy**:
   - Automatic on every push to main
   - Preview deployments for pull requests
   - Custom domains via Vercel dashboard

### Self-Hosted Deployment

**Docker** (create Dockerfile):
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Build and run**:
```bash
docker build -t open-researcher .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-... open-researcher
```

**Traditional Server**:
```bash
# On server
git clone <repo>
cd open-researcher
npm install
npm run build

# Set environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export FIRECRAWL_API_KEY=fc-...

# Start with PM2
npm install -g pm2
pm2 start npm --name "open-researcher" -- start
pm2 save
pm2 startup
```

---

## File Reference

### Critical Files

**Configuration**:
- `C:\Users\PC\open-researcher\.env.local` - Environment variables (create from .env.local.example)
- `C:\Users\PC\open-researcher\next.config.ts` - Next.js configuration
- `C:\Users\PC\open-researcher\tailwind.config.ts` - Tailwind CSS configuration
- `C:\Users\PC\open-researcher\package.json` - Dependencies and scripts

**Core Application**:
- `C:\Users\PC\open-researcher\lib\open-researcher-agent.ts` - AI agent and tool execution (998 lines)
- `C:\Users\PC\open-researcher\app\api\open-researcher\route.ts` - Main streaming API endpoint
- `C:\Users\PC\open-researcher\components\thinking-chat.tsx` - Main chat interface (592 lines)
- `C:\Users\PC\open-researcher\components\search-results-display.tsx` - Browser UI component (465 lines)

**UI Components**:
- `C:\Users\PC\open-researcher\app\open-researcher\open-researcher-content.tsx` - Main page component
- `C:\Users\PC\open-researcher\components\thinking-display.tsx` - Thinking visualization (490 lines)
- `C:\Users\PC\open-researcher\components\markdown-renderer.tsx` - Markdown display
- `C:\Users\PC\open-researcher\components\citation-tooltip.tsx` - Citation tooltips

**API Routes**:
- `C:\Users\PC\open-researcher\app\api\open-researcher\route.ts` - Research endpoint (114 lines)
- `C:\Users\PC\open-researcher\app\api\open-researcher\follow-up\route.ts` - Follow-up questions (74 lines)
- `C:\Users\PC\open-researcher\app\api\scrape\route.ts` - Firecrawl proxy (59 lines)
- `C:\Users\PC\open-researcher\app\api\check-env\route.ts` - Environment validation

**Styles**:
- `C:\Users\PC\open-researcher\app\globals.css` - Global styles and animations
- `C:\Users\PC\open-researcher\components\ui\*.tsx` - Shadcn/UI component library (50+ files)

---

## Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API Reference](https://docs.anthropic.com/)
- [Firecrawl Documentation](https://docs.firecrawl.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/)

### Community
- [GitHub Repository](https://github.com/mendableai/open-researcher)
- [Firecrawl Discord](https://discord.gg/firecrawl)
- [Anthropic Community](https://community.anthropic.com/)

### Related Projects
- [Firecrawl](https://www.firecrawl.dev/) - Web scraping infrastructure
- [Claude](https://claude.ai/) - AI assistant by Anthropic
- [Shadcn/UI](https://ui.shadcn.com/) - Component library

---

## Contributing

### Development Workflow

1. **Fork and clone**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/open-researcher
   cd open-researcher
   git remote add upstream https://github.com/mendableai/open-researcher
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make changes**:
   - Follow existing code patterns
   - Add TypeScript types
   - Include dark mode styles
   - Test on mobile and desktop

4. **Commit changes**:
   ```bash
   git add .
   git commit -m 'Add amazing feature'
   ```

5. **Push and create PR**:
   ```bash
   git push origin feature/amazing-feature
   ```
   - Open pull request on GitHub
   - Describe changes and motivation
   - Link related issues

### Code Style

**TypeScript**:
- Use explicit types for function parameters and returns
- Avoid `any`, prefer `unknown` with type guards
- Interface over type for object shapes

**React**:
- Functional components with hooks
- Props destructuring with types
- `'use client'` directive for client components

**CSS/Tailwind**:
- Use `cn()` utility for conditional classes
- Mobile-first responsive design
- Dark mode support for all components

**File Naming**:
- Components: `kebab-case.tsx`
- API routes: `route.ts`
- Types: `types.ts` or inline interfaces
- Utilities: `utils.ts`

---

## License

MIT License - See LICENSE file for details.

Built with [Firecrawl](https://www.firecrawl.dev/) and [Anthropic Claude](https://www.anthropic.com/).
