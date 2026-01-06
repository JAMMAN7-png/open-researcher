# Open Researcher - Project Overview

## Purpose
Open Researcher is an AI-powered web research assistant that uses Firecrawl for web searching/scraping and Anthropic's Claude claude-opus-4 with interleaved thinking for intelligent research queries.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI Model**: Anthropic Claude claude-opus-4 (claude-opus-4-20250514) with interleaved thinking beta
- **Web Scraping**: Firecrawl API (search + scrape)
- **Package Manager**: pnpm (has both npm and pnpm lock files)

## Key Architecture
- **Frontend**: React components with streaming SSE for real-time updates
- **Backend**: Next.js API routes for request handling
- **Agent Pattern**: Agentic loop with tool calling (web_search, deep_scrape, analyze_content)

## Key Directories
- `app/` - Next.js App Router pages and API routes
- `app/api/open-researcher/` - Main research API endpoint
- `app/open-researcher/` - Research UI page
- `components/` - React components (thinking-chat, search-results, markdown-renderer)
- `lib/` - Core logic (open-researcher-agent.ts)
- `components/ui/` - shadcn/ui components
