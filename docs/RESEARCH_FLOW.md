# Open Researcher: Research Flow Architecture

This document provides a comprehensive technical explanation of how Open Researcher processes user queries and conducts AI-powered web research.

## Table of Contents

- [Overview](#overview)
- [Architecture Diagram](#architecture-diagram)
- [Phase 1: Query Submission](#phase-1-query-submission)
- [Phase 2: AI Reasoning with Interleaved Thinking](#phase-2-ai-reasoning-with-interleaved-thinking)
- [Phase 3: Source Discovery](#phase-3-source-discovery)
- [Phase 4: Information Gathering](#phase-4-information-gathering)
- [Phase 5: Synthesis and Response](#phase-5-synthesis-and-response)
- [Phase 6: Results Presentation](#phase-6-results-presentation)
- [Event Types and Data Flow](#event-types-and-data-flow)
- [Tools Available to the AI](#tools-available-to-the-ai)
- [Error Handling](#error-handling)

---

## Overview

Open Researcher is an AI-powered research assistant that combines:

- **Claude Opus 4** with interleaved thinking for reasoning
- **Firecrawl** for web search and content scraping
- **Server-Sent Events (SSE)** for real-time streaming updates
- **React** frontend for displaying the research process

The system implements an **agentic loop** where the AI autonomously decides what tools to use, what queries to make, and how to synthesize findings into a coherent response.

---

## Architecture Diagram

```
User Query
    |
    v
+-------------------+
|  Frontend (React) |
|  thinking-chat.tsx|
+-------------------+
    |
    | POST /api/open-researcher
    v
+-------------------+
|  API Route        |
|  route.ts         |
+-------------------+
    |
    | performResearchWithStreaming()
    v
+---------------------------+
|  Research Agent           |
|  open-researcher-agent.ts |
+---------------------------+
    |
    +---> Claude Opus 4 API (Anthropic)
    |         |
    |         +---> Interleaved Thinking
    |         +---> Tool Selection
    |         +---> Response Generation
    |
    +---> Firecrawl API
              |
              +---> web_search
              +---> deep_scrape
              +---> analyze_content
    |
    v
+-------------------+
|  SSE Stream       |
|  (Real-time)      |
+-------------------+
    |
    v
+-------------------+
|  UI Components    |
|  ThinkingDisplay  |
|  SearchResults    |
+-------------------+
```

---

## Phase 1: Query Submission

### User Input Flow

1. **User enters query** in the search input (`thinking-chat.tsx`)
2. **Frontend validates** Firecrawl API key availability
3. **HTTP POST request** sent to `/api/open-researcher`

### Code Path

```
ThinkingChat.handleSearch()
    -> fetch('/api/open-researcher', { query })
    -> API route receives request
```

### Request Structure

```typescript
// POST /api/open-researcher
{
  query: string  // User's research question
}

// Headers
{
  'Content-Type': 'application/json',
  'X-Firecrawl-API-Key': string  // Optional, from localStorage
}
```

### API Key Resolution

The system checks for API keys in this priority order:

1. **Firecrawl**: Header (`X-Firecrawl-API-Key`) > Environment variable
2. **Anthropic**: Environment variable only (server-side)

---

## Phase 2: AI Reasoning with Interleaved Thinking

### The Thinking Process

Open Researcher uses Claude's **interleaved thinking** beta feature, which allows the AI to show its reasoning process between tool calls.

### System Prompt

The AI receives a specialized system prompt that guides its research behavior:

```typescript
const systemPrompt = `You are a research assistant with access to web search
and scraping tools. When asked to find specific blog posts on a website,
you should:

1. For blog post requests:
   - First navigate to the main blog page to see all posts in order
   - Blog posts are typically ordered newest to oldest
   - Count posts as they appear on the page

2. To find the correct blog post:
   - Search with site-specific queries
   - Scrape the blog index page to see all posts in order
   - Count carefully to identify the correct post

3. Be thorough and methodical. Always verify you have the correct
   information by its position in the listing.`;
```

### Interleaved Thinking Configuration

```typescript
const requestParams = {
  model: "claude-opus-4-20250514",
  max_tokens: 8000,
  system: systemPrompt,
  thinking: {
    type: "enabled",
    budget_tokens: 20000  // Tokens allocated for thinking
  },
  tools: tools,
  messages: messages
};

// Uses the interleaved-thinking-2025-05-14 beta
response = await anthropic.beta.messages.create({
  ...requestParams,
  betas: ["interleaved-thinking-2025-05-14"]
});
```

### Response Block Types

The AI produces three types of content blocks:

| Block Type | Description | Example |
|------------|-------------|---------|
| `thinking` | AI's internal reasoning | "I need to search for the latest AI news..." |
| `tool_use` | Request to execute a tool | `{ name: "web_search", input: { query: "..." } }` |
| `text` | Final response text | "Based on my research, here are the findings..." |

### Recursive Processing Loop

The agent implements a recursive tool execution loop:

```typescript
async function processResponse(resp) {
  for (const block of resp.content) {
    if (block.type === 'thinking') {
      // Record thinking, emit event
      onEvent({ type: 'thinking', content: block.thinking });

    } else if (block.type === 'tool_use') {
      // Execute tool
      const toolResult = await executeTool(block.name, block.input);

      // Send result back to Claude
      currentMessages.push({
        role: "assistant",
        content: [...assistantContent]
      }, {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: block.id, content: toolResult }]
      });

      // Get next response (may include more thinking/tools)
      const nextResponse = await anthropic.beta.messages.create(...);
      await processResponse(nextResponse);  // Recursive call
      return;

    } else if (block.type === 'text') {
      // Final response
      onEvent({ type: 'response', content: block.text });
    }
  }
}
```

---

## Phase 3: Source Discovery

### Web Search Tool

The primary source discovery mechanism is the `web_search` tool powered by Firecrawl.

### Tool Definition

```typescript
{
  name: "web_search",
  description: "Search the web and optionally scrape content from results.
                Supports Google search operators (site:, intitle:, etc.).",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", default: 5 },
      scrape_content: { type: "boolean", default: false },
      tbs: {
        type: "string",
        enum: ["qdr:h", "qdr:d", "qdr:w", "qdr:m", "qdr:y"],
        description: "Time-based search filter"
      }
    },
    required: ["query"]
  }
}
```

### Two-Step Search Process

1. **Metadata Search** (fast): Get titles, URLs, descriptions
2. **Content Scraping** (optional): Extract full page content

```typescript
async function executeWebSearch(query, limit, scrapeContent, tbs) {
  // Step 1: Search without scraping (metadata only)
  const metadataResults = await firecrawl.search(query, {
    limit,
    scrapeOptions: { formats: [] }  // Empty = no scraping
  });

  // Step 2: If scraping requested, analyze and scrape
  if (scrapeContent) {
    const urlsToScrape = filterUrlsByIntent(metadataResults, query);
    const scrapedResults = await firecrawl.search(query, {
      limit,
      scrapeOptions: { formats: ["markdown"] }
    });
  }
}
```

### Query Intent Analysis

The system analyzes the query to determine what types of content to prioritize:

```typescript
const querySignals = {
  wantsRecent: /latest|recent|newest|new|today/i.test(query),
  wantsBlog: /blog|post|article|news|update/i.test(query),
  wantsDocs: /documentation|docs|api|reference|guide/i.test(query),
  hasTimeFilter: !!tbs,
  hasSiteFilter: /site:/i.test(query)
};
```

### URL Filtering Logic

URLs are filtered based on intent signals:

```typescript
const urlsToScrape = metadataResults.data.filter((result, index) => {
  // For time-sensitive queries
  if (querySignals.wantsRecent || querySignals.hasTimeFilter) {
    return true;  // Include all results
  }

  // For blog content
  if (querySignals.wantsBlog) {
    const url = new URL(result.url);
    return url.pathname.includes('blog') ||
           url.pathname.includes('post');
  }

  // Default: top results
  return index < 3;
});
```

---

## Phase 4: Information Gathering

### Deep Scrape Tool

For detailed content extraction from specific URLs:

```typescript
{
  name: "deep_scrape",
  description: "Scrape a single URL and optionally follow its links",
  input_schema: {
    properties: {
      source_url: { type: "string" },
      link_filter: { type: "string", description: "Regex pattern" },
      max_depth: { type: "number", default: 1 },
      max_links: { type: "number", default: 5 },
      formats: { type: "array", default: ["markdown"] }
    }
  }
}
```

### Deep Scrape Process

```typescript
async function executeDeepScrape(sourceUrl, linkFilter, maxDepth, maxLinks) {
  // 1. Scrape source page
  const sourceResult = await firecrawl.scrapeUrl(sourceUrl, {
    formats: ['markdown', 'links', 'screenshot@fullPage']
  });

  // 2. Extract and filter links (if link_filter provided)
  if (linkFilter) {
    const filterRegex = new RegExp(linkFilter, 'i');
    const filteredLinks = sourceResult.links.filter(link =>
      filterRegex.test(link)
    );

    // 3. Scrape filtered links in parallel
    const scrapePromises = filteredLinks.slice(0, maxLinks).map(link =>
      firecrawl.scrapeUrl(link, { formats: [...formats, 'screenshot@fullPage'] })
    );

    const results = await Promise.all(scrapePromises);
  }
}
```

### Content Analysis Tool

For processing already-gathered content:

```typescript
{
  name: "analyze_content",
  description: "Analyze scraped content to extract specific information",
  input_schema: {
    properties: {
      content: { type: "string" },
      analysis_type: {
        type: "string",
        enum: ["sentiment", "key_facts", "trends", "summary", "credibility"]
      },
      context: { type: "string" }
    }
  }
}
```

### Analysis Types

| Type | What It Extracts |
|------|------------------|
| `sentiment` | Positive/negative indicators |
| `key_facts` | Sentences with numbers, percentages, key terms |
| `trends` | Growth, decline, innovation, adoption signals |
| `summary` | Most important sentences |
| `credibility` | Source reliability indicators |

Example credibility assessment:

```typescript
const credibilityFactors = {
  'Has citations': /according to|study|research|report/i.test(content),
  'Includes data': /\d+%|\$\d+|statistics/i.test(content),
  'Official source': /\.gov|\.edu|official/i.test(content),
  'Recent info': /2024|2025|recent|latest/i.test(content),
};
```

---

## Phase 5: Synthesis and Response

### How the AI Synthesizes Findings

The AI's thinking process typically follows this pattern:

1. **Initial Analysis**: "I need to find information about X"
2. **Tool Selection**: "I'll use web_search with these parameters"
3. **Result Evaluation**: "These results show... but I need more detail on..."
4. **Iterative Refinement**: Additional searches or scrapes
5. **Synthesis**: Combining information from multiple sources
6. **Response Generation**: Final markdown-formatted answer

### Response Format

The AI generates responses in markdown with citations:

```markdown
Based on my research, here are the key findings:

## Topic Overview
[Summary of findings with inline citations]

## Key Points
- Point 1 [Source: example.com]
- Point 2 [Source: another-source.com]

## Detailed Analysis
[In-depth information with proper attribution]
```

---

## Phase 6: Results Presentation

### Server-Sent Events (SSE) Stream

The API returns a streaming response with real-time events:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    await performResearchWithStreaming(query, (event) => {
      const data = `data: ${JSON.stringify({ type: 'event', event })}\n\n`;
      controller.enqueue(encoder.encode(data));
    });

    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
    controller.close();
  }
});
```

### Frontend Event Processing

```typescript
while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));

      switch (data.type) {
        case 'event':
          // Update UI with thinking/tool events
          break;
        case 'response':
          // Display final response
          break;
        case 'done':
          // Mark research complete
          break;
      }
    }
  }
}
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `ThinkingChat` | Main chat interface, message handling |
| `ThinkingDisplay` | Shows thinking blocks and tool calls |
| `SearchResultsDisplay` | Browser-like view of search results |
| `ScreenshotPreview` | Displays captured page screenshots |
| `MarkdownRenderer` | Renders final response with citations |
| `CitationTooltip` | Interactive source references |

---

## Event Types and Data Flow

### Event Schema

```typescript
interface ThinkingEvent {
  type: 'start' | 'thinking' | 'tool_call' | 'tool_result' | 'response' | 'summary';
  timestamp?: number;
  content?: string;
  number?: number;
  tool?: string;
  parameters?: Record<string, unknown>;
  result?: string;
  screenshots?: Array<{ url: string; screenshot?: string }>;
  duration?: number;
  thinkingBlocks?: number;
  toolCalls?: number;
}
```

### Event Flow Timeline

```
1. { type: 'start', query: "user question" }
   |
2. { type: 'thinking', number: 1, content: "I need to..." }
   |
3. { type: 'tool_call', tool: 'web_search', parameters: {...} }
   |
4. { type: 'tool_result', tool: 'web_search', result: "...", duration: 2500 }
   |
5. { type: 'thinking', number: 2, content: "Based on these results..." }
   |
6. { type: 'tool_call', tool: 'deep_scrape', parameters: {...} }
   |
7. { type: 'tool_result', tool: 'deep_scrape', result: "...", screenshots: [...] }
   |
8. { type: 'thinking', number: 3, content: "Now I can synthesize..." }
   |
9. { type: 'response', content: "Based on my research..." }
   |
10. { type: 'summary', thinkingBlocks: 3, toolCalls: 2 }
```

---

## Tools Available to the AI

### Tool Summary Table

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `web_search` | Search web, optionally scrape | `query`, `limit`, `scrape_content`, `tbs` |
| `deep_scrape` | Scrape URL and follow links | `source_url`, `link_filter`, `max_depth` |
| `analyze_content` | Process gathered content | `content`, `analysis_type`, `context` |

### Tool Execution Router

```typescript
export async function executeTool(toolName: string, input: Record<string, unknown>) {
  switch (toolName) {
    case 'web_search':
      return await executeWebSearch(input.query, input.limit, input.scrape_content);
    case 'deep_scrape':
      return await executeDeepScrape(input.source_url, input.link_filter);
    case 'analyze_content':
      return { content: await analyzeContent(input.content, input.analysis_type) };
    default:
      return { content: `Unknown tool: ${toolName}` };
  }
}
```

---

## Error Handling

### Error Categories

| Error Type | Cause | User Message |
|------------|-------|--------------|
| Model Error | Claude Opus 4 unavailable | "Model not available in your region" |
| Beta Feature Error | Interleaved thinking not enabled | "Beta feature requires special access" |
| Authentication Error | Invalid Anthropic API key | "Invalid API key" |
| Firecrawl Error | Search/scrape failure | "Error performing search" |

### Error Propagation

```typescript
try {
  const response = await anthropic.beta.messages.create({...});
} catch (error) {
  if (error.message.includes('model')) {
    throw new Error(`Model error: The claude-opus-4 model may not be available`);
  }
  if (error.message.includes('beta')) {
    throw new Error(`Beta feature error: interleaved-thinking not enabled`);
  }
  throw error;
}
```

### Frontend Error Display

```typescript
if (error instanceof Error) {
  if (error.message.includes('ANTHROPIC_API_KEY')) {
    errorMessage = 'The Anthropic API key is not configured.';
  } else if (error.message.includes('model')) {
    errorMessage = 'The required AI model is not available.';
  }
}
```

---

## Performance Considerations

### Parallel Execution

- Deep scrape follows links in parallel using `Promise.all()`
- Multiple independent searches could be parallelized

### Token Management

- Thinking budget: 20,000 tokens
- Max response tokens: 8,000 tokens
- Content truncation: 3,000 characters for page previews, 500 for snippets

### Caching

- Firecrawl client: Lazy initialization, singleton pattern
- Anthropic client: Lazy initialization, singleton pattern

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/open-researcher-agent.ts` | Core research agent, tools, AI integration |
| `app/api/open-researcher/route.ts` | API endpoint, SSE streaming |
| `app/api/open-researcher/follow-up/route.ts` | Follow-up question generation |
| `components/thinking-chat.tsx` | Main chat UI, event processing |
| `components/thinking-display.tsx` | Thinking visualization |
| `components/search-results-display.tsx` | Search results browser view |
