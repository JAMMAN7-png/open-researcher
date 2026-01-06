# Data Transformations in Open Researcher

## Overview
The application transforms data through multiple stages from user input to final display.

## Key Transformation Points

### 1. User Query Analysis (lib/open-researcher-agent.ts:216-222)
Query signals are analyzed for intent:
- `wantsRecent`: /latest|recent|newest|new|today/i
- `wantsBlog`: /blog|post|article|news|update/i
- `wantsDocs`: /documentation|docs|api|reference|guide/i
- `hasTimeFilter`: presence of tbs parameter
- `hasSiteFilter`: /site:/i test

### 2. Firecrawl Search Result Transformation (lib/open-researcher-agent.ts:177-396)
Raw search results -> Structured output with:
- URL, title, description extraction
- Screenshot handling
- Date extraction from content (multiple patterns)
- Relevance scoring and sorting

### 3. Content Analysis Transformations (lib/open-researcher-agent.ts:399-481)
- Sentiment analysis (keyword matching)
- Key facts extraction (regex patterns)
- Trend identification
- Summary generation
- Credibility assessment

### 4. SSE Stream Transformation (app/api/open-researcher/route.ts:38-90)
Events are transformed for SSE streaming:
- Add timestamps to events
- JSON encode with type markers
- Error message normalization

### 5. Markdown Rendering (components/markdown-renderer.tsx:18-124)
Raw markdown -> HTML with:
- Links: `[text](url)` -> anchor tags
- Citations: `[1]` -> sup elements with tooltips
- Bold/italic text
- Headers (h1-h3)
- Lists (ordered/unordered)
- Code blocks and inline code
- Tables

### 6. Search Result Parsing (components/thinking-chat.tsx:273-324)
Tool result text -> Structured array:
- Title extraction: /^\[(\d+)\]\s+(.+)$/
- URL extraction: /^URL: (.+)$/
- Description: /^Description: (.+)$/
- Date: /^Date: (.+)$/
- Content preview: /^Content preview: (.+)$/

### 7. Citation URL Transformation (components/citation-tooltip.tsx:17-24)
URL -> Favicon URL:
`https://www.google.com/s2/favicons?domain=${domain}&sz=32`
