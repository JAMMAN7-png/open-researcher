# Design Patterns and Architecture

## Overall Architecture Pattern

### Next.js App Router Architecture
The project uses Next.js 15 App Router with a clear separation between:
- **Server Components**: Default, used for layouts and pages
- **Client Components**: Marked with 'use client', used for interactive UI
- **API Routes**: Route handlers in `app/api/` for backend logic

### Architectural Layers

1. **Presentation Layer** (Components)
   - UI rendering and user interaction
   - Client-side state management
   - Event handling

2. **Business Logic Layer** (Lib)
   - Core agent logic and AI integration
   - Tool execution and orchestration
   - Data transformation

3. **API Layer** (App/API)
   - HTTP request/response handling
   - Authentication and validation
   - Server-sent events (SSE) streaming

4. **External Services Layer**
   - Anthropic Claude API
   - Firecrawl API

## Key Design Patterns

### 1. Streaming Response Pattern (SSE)
**File**: `app/api/open-researcher/route.ts`
```typescript
// Server-sent events for real-time AI responses
const stream = new ReadableStream({
  async start(controller) {
    await performResearchWithStreaming(query, (event) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    })
  }
})
```

**Purpose**: Real-time updates to UI as AI thinks and executes tools
**Benefits**: Better UX, shows progress, allows cancellation

### 2. Callback Pattern for Events
**File**: `lib/open-researcher-agent.ts`
```typescript
export async function performResearchWithStreaming(
  query: string, 
  onEvent: (event: { type: string; [key: string]: unknown }) => void
): Promise<string>
```

**Purpose**: Emit events during AI processing
**Event Types**: 
- `thinking`: AI reasoning steps
- `tool_call`: When AI uses a tool
- `tool_result`: Tool execution results
- `response`: Final answer

### 3. Tool Pattern (Agentic AI)
**File**: `lib/open-researcher-agent.ts`
```typescript
const tools: ToolDefinition[] = [
  {
    name: "web_search",
    description: "...",
    input_schema: { /* JSON Schema */ }
  },
  // More tools...
]

async function executeTool(toolName: string, input: Record<string, unknown>)
```

**Purpose**: Modular AI capabilities
**Current Tools**:
- `web_search`: Firecrawl search with optional scraping
- `deep_scrape`: Multi-page scraping with link following
- `analyze_content`: Content analysis (sentiment, facts, trends)

### 4. Composition Pattern (shadcn/ui)
**File**: `components/ui/button.tsx`
```typescript
// Uses Radix UI primitives + custom styling
import { Slot } from "@radix-ui/react-slot"

const Button = ({ asChild, ...props }) => {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}
```

**Purpose**: Flexible, composable UI components
**Benefits**: Accessibility, customization, consistency

### 5. Lazy Initialization Pattern
**File**: `lib/open-researcher-agent.ts`
```typescript
let anthropic: Anthropic | null = null
let firecrawl: FirecrawlApp | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
}
```

**Purpose**: Delay initialization until needed
**Benefits**: Faster cold starts on Vercel, validates keys only when used

### 6. Compound Component Pattern
**File**: `components/thinking-chat.tsx`
```typescript
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  searchData?: { /* nested structure */ }
  sources?: Array<{ /* source info */ }>
}
```

**Purpose**: Rich message objects with nested metadata
**Benefits**: Single source of truth, type-safe, extensible

### 7. State Lifting Pattern
**Flow**: `thinking-chat.tsx` → `open-researcher-content.tsx`
```typescript
// Child component
<ThinkingChat 
  onMessagesChange={setHasMessages}
  hasFirecrawlKey={hasFirecrawlKey}
/>

// Parent component manages shared state
const [hasMessages, setHasMessages] = useState(false)
```

**Purpose**: Share state between components
**Benefits**: Single source of truth, predictable data flow

### 8. Custom Hook Pattern (Implied, not yet used)
**Potential**: Create custom hooks for reusable logic
```typescript
// Example: useSearchResults.ts
export function useSearchResults() {
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  // Logic...
  return { results, isLoading }
}
```

**Current State**: Not yet implemented (state kept in components)

### 9. Render Props / Children as Function (Not used)
**Alternative**: Direct prop passing is preferred
**Rationale**: Simpler, more explicit

## Component Architecture Patterns

### Feature Component Pattern
**Example**: `thinking-chat.tsx`
- Self-contained feature
- Manages own state
- Emits events to parent
- Composes smaller UI components

**Structure**:
```
ThinkingChat (Feature Component)
  ├── State Management
  ├── Event Handlers
  ├── Message Display (composition)
  │   ├── MarkdownRenderer
  │   ├── CitationTooltip
  │   └── ThinkingDisplay
  └── Input Form (composition)
      └── Button, Input (shadcn/ui)
```

### Page Component Pattern
**Example**: `app/open-researcher/page.tsx`
- Server Component (default)
- Minimal logic
- Delegates to Client Components
- Sets metadata

```typescript
export const metadata: Metadata = {
  title: 'Open Researcher',
  description: '...'
}

export default function Page() {
  return <ClientContent />
}
```

### Layout Pattern
**File**: `app/layout.tsx`
- Root layout with fonts and global providers
- Minimal, reusable across pages
- Includes global components (Toaster)

## Data Flow Patterns

### Unidirectional Data Flow
```
User Input → Event Handler → API Request → SSE Stream → State Update → UI Render
```

**No global state management**: All state flows through props and callbacks

### Optimistic UI Updates (Not implemented)
**Future Enhancement**: Could add optimistic updates for better perceived performance

## Error Handling Patterns

### Layered Error Handling
1. **API Layer**: Catch errors, return user-friendly messages
2. **Client Layer**: Try-catch in event handlers
3. **UI Layer**: Display errors via toast notifications

### Error Propagation
```typescript
try {
  await apiCall()
} catch (error) {
  if (error instanceof Error) {
    // Type-safe error handling
    if (error.message.includes('ANTHROPIC_API_KEY')) {
      // Specific error
    }
  }
  // Generic fallback
}
```

## Performance Patterns

### Memoization
**File**: `components/markdown-renderer.tsx`
```typescript
export const MarkdownRenderer = memo(function MarkdownRenderer({ ... }) {
  // Component logic
})
```

**Purpose**: Prevent unnecessary re-renders of expensive components

### Streaming for Large Responses
- SSE for real-time updates
- Prevents waiting for full response
- Better perceived performance

### Code Splitting (Potential)
**Not yet implemented**: Could use Next.js dynamic imports for large components
```typescript
const HeavyComponent = dynamic(() => import('./heavy-component'))
```

## API Design Patterns

### RESTful Conventions
- POST for mutations
- GET for queries (check-env)
- Standard HTTP status codes

### Middleware Pattern (Implicit)
**File**: `app/api/open-researcher/route.ts`
```typescript
// API key validation
if (!process.env.ANTHROPIC_API_KEY) {
  return NextResponse.json({ error: '...' }, { status: 500 })
}

// Header injection for Firecrawl
const firecrawlApiKey = req.headers.get('X-Firecrawl-API-Key') || process.env.FIRECRAWL_API_KEY
process.env.FIRECRAWL_API_KEY = firecrawlApiKey
```

## Styling Patterns

### Utility-First CSS (Tailwind)
- Inline utility classes
- Responsive modifiers (lg:, md:)
- Dark mode variants (dark:)
- Custom animations in globals.css

### CSS Custom Properties for Theming
**File**: `app/globals.css`
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  /* More variables... */
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* Dark mode overrides... */
}
```

### Component Variants (CVA)
**File**: `components/ui/button.tsx`
```typescript
const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: { default: "...", code: "...", orange: "..." },
      size: { default: "...", sm: "...", lg: "..." }
    }
  }
)
```

## Testing Patterns (Not Yet Implemented)

### Recommended Patterns
1. **Unit Tests**: Jest + React Testing Library
2. **Integration Tests**: API route testing
3. **E2E Tests**: Playwright for user flows
4. **Component Tests**: Storybook for UI components

## Security Patterns

### API Key Management
- Environment variables for secrets
- Never commit .env.local
- Client-side API key storage in localStorage (Firecrawl only)
- Server-side validation before use

### XSS Prevention
- React's built-in escaping
- dangerouslySetInnerHTML used sparingly (markdown renderer)
- Custom markdown parser for controlled rendering

## Future Architectural Considerations

### Potential Improvements
1. **State Management**: Consider Zustand/Jotai if state grows complex
2. **Data Fetching**: React Query for caching and deduplication
3. **Testing**: Add comprehensive test suite
4. **Monitoring**: Add error tracking (Sentry)
5. **Analytics**: Track feature usage
6. **Caching**: Redis for API response caching
7. **Rate Limiting**: Protect API routes
8. **WebSockets**: Alternative to SSE for bidirectional communication