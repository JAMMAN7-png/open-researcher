# Open Researcher Project Overview

## Purpose
Open Researcher is a Firecrawl-powered AI research assistant that provides:
- Web search capabilities via Firecrawl API
- Content scraping and analysis
- Agentic reasoning using Claude claude-opus-4 with interleaved thinking

## Tech Stack
- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript 5+
- **UI**: React 19, Tailwind CSS 4, shadcn/ui components
- **AI Services**:
  - Anthropic Claude claude-opus-4 (claude-opus-4-20250514) for research reasoning
  - Firecrawl (@mendable/firecrawl-js) for web search and scraping
- **Build**: Turbopack (dev mode)

## Project Structure
```
app/
  page.tsx                    # Main page (renders OpenResearcherContent)
  layout.tsx                  # Root layout with fonts and Toaster
  open-researcher/
    page.tsx                  # /open-researcher route
    open-researcher-content.tsx  # Main UI component
  api/
    check-env/route.ts        # Environment variable checker
    open-researcher/route.ts  # Main research API endpoint
    open-researcher/follow-up/route.ts  # Follow-up questions generator
    scrape/route.ts           # Direct scrape API for key validation

components/
  thinking-chat.tsx           # Main chat interface with research flow
  search-results-display.tsx  # Search results visualization
  markdown-renderer.tsx       # Markdown rendering for responses
  citation-tooltip.tsx        # Citation display
  ui/                         # shadcn/ui component library

lib/
  open-researcher-agent.ts    # Core research agent with Anthropic integration
  utils.ts                    # Utility functions (cn for className)
```

## Required Environment Variables
- `ANTHROPIC_API_KEY` - Required for Claude claude-opus-4 access
- `FIRECRAWL_API_KEY` - Can be set via env or provided by user in UI
