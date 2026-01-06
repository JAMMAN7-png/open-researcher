# Codebase Structure

```
open-researcher/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes (Backend)
│   │   ├── check-env/route.ts    # Environment validation endpoint
│   │   ├── open-researcher/      # Main research API
│   │   │   ├── route.ts          # POST: Streaming research endpoint
│   │   │   └── follow-up/route.ts# POST: Generate follow-up questions
│   │   └── scrape/route.ts       # POST: Direct Firecrawl scraping
│   ├── open-researcher/          # Research page route
│   │   ├── page.tsx              # Page component (metadata)
│   │   └── open-researcher-content.tsx # Main UI (client component)
│   ├── layout.tsx                # Root layout (fonts, Toaster)
│   ├── page.tsx                  # Home page (redirects to researcher)
│   └── globals.css               # Global styles, CSS variables
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui primitives (~50 components)
│   ├── thinking-chat.tsx         # Main chat interface
│   ├── thinking-display.tsx      # Thinking process visualization
│   ├── search-results-display.tsx# Browser-like results view
│   ├── markdown-renderer.tsx     # Markdown to HTML renderer
│   ├── citation-tooltip.tsx      # Source citation popups
│   ├── screenshot-preview.tsx    # Scraped page previews
│   └── animated-cursor.tsx       # Animation effects
├── lib/                          # Utility/Core Logic
│   ├── open-researcher-agent.ts  # AI Agent orchestration (core!)
│   └── utils.ts                  # cn() class merging utility
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind configuration
└── next.config.ts                # Next.js configuration
```

## Key Files by Function
- **Core Logic**: `lib/open-researcher-agent.ts` - All AI/scraping logic
- **Main UI**: `components/thinking-chat.tsx` - Chat interface
- **Entry Point**: `app/page.tsx` -> `app/open-researcher/open-researcher-content.tsx`
