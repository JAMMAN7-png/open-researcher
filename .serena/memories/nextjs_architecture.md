# Next.js Architecture Details

## Router Type
**App Router** (Next.js 15.3.4)

## Route Structure

### Pages
1. **Root Page** (`/`) - `app/page.tsx`
   - Server Component (exports metadata)
   - Renders `OpenResearcherContent` client component
   
2. **Open Researcher Page** (`/open-researcher`) - `app/open-researcher/page.tsx`
   - Server Component (exports metadata)
   - Renders `OpenResearcherContent` client component
   - Both routes render the same component

### API Routes (Route Handlers)
1. **`/api/open-researcher`** - `app/api/open-researcher/route.ts`
   - POST endpoint
   - Streaming response (Server-Sent Events)
   - Handles main research queries
   - Integrates Anthropic Claude and Firecrawl

2. **`/api/open-researcher/follow-up`** - `app/api/open-researcher/follow-up/route.ts`
   - POST endpoint
   - Generates follow-up questions using Claude Haiku
   - Returns JSON response

3. **`/api/scrape`** - `app/api/scrape/route.ts`
   - POST endpoint
   - Firecrawl scraping proxy
   - Supports single URL and batch scraping

4. **`/api/check-env`** - `app/api/check-env/route.ts`
   - GET endpoint
   - Returns environment variable status
   - Development debug info

## Server vs Client Components

### Server Components
- `app/layout.tsx` - Root layout with fonts and metadata
- `app/page.tsx` - Home page wrapper
- `app/open-researcher/page.tsx` - App page wrapper
- All API route handlers

### Client Components (marked with 'use client')
- `app/open-researcher/open-researcher-content.tsx` - Main application UI
- `components/thinking-chat.tsx` - Chat interface
- `components/markdown-renderer.tsx` - Markdown display
- `components/citation-tooltip.tsx` - Citation tooltips
- `components/search-results-display.tsx` - Search results
- `components/thinking-display.tsx` - AI thinking process
- All components in `components/ui/` directory

## Data Fetching Patterns

### Streaming Responses
- `/api/open-researcher` uses `ReadableStream` for Server-Sent Events (SSE)
- Streams AI thinking process and results in real-time
- Client uses `fetch` with stream reader to process events

### Client-Side Fetching
- All data fetching happens client-side via fetch API
- No server-side data fetching (getServerSideProps, getStaticProps)
- API key management through headers and localStorage

## Server Actions
**None found** - No 'use server' directives in codebase

## Middleware
**None** - No middleware.ts file present

## Streaming Implementation

### API Route Streaming (`app/api/open-researcher/route.ts`)
```typescript
const stream = new ReadableStream({
  async start(controller) {
    // Streams events as SSE format
    const data = `data: ${JSON.stringify(event)}\n\n`
    controller.enqueue(encoder.encode(data))
  }
})
```

### Client-Side Stream Processing (`components/thinking-chat.tsx`)
```typescript
const reader = response.body?.getReader()
const decoder = new TextDecoder()
while (true) {
  const { done, value } = await reader.read()
  // Process SSE chunks
}
```

### Markdown Streaming (`components/markdown-renderer.tsx`)
- Supports streaming prop to show cursor animation
- Updates content dynamically as it arrives

## Experimental Features
**None detected** - No experimental or unstable Next.js features in use

## Configuration

### next.config.ts
- Minimal configuration
- No custom webpack, rewrites, redirects, or experimental features

### Development
- Turbopack enabled for dev server (`--turbopack` flag)
- Fast refresh and hot reload

## Metadata
- Static metadata exports in page.tsx files
- No dynamic metadata generation (generateMetadata)
- No static params generation (generateStaticParams)

## Route Segment Configuration
- No custom route segment config (no revalidate, dynamic, fetchCache exports)
- All routes use default Next.js behavior
