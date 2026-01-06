# Open Researcher - User Experience Documentation

## Table of Contents
1. [Overview](#overview)
2. [User Journey Map](#user-journey-map)
3. [Interaction Points](#interaction-points)
4. [Feedback Mechanisms](#feedback-mechanisms)
5. [Loading and Progress States](#loading-and-progress-states)
6. [Error Handling](#error-handling)
7. [Mobile vs Desktop Experience](#mobile-vs-desktop-experience)
8. [Component Breakdown](#component-breakdown)

---

## Overview

Open Researcher is an AI-powered research tool that combines Firecrawl web scraping with Claude AI reasoning. The application provides a chat-based interface where users can submit research queries and receive comprehensive, cited responses with real-time visibility into the AI's thinking process.

### Core Value Proposition
- Real-time web search and content analysis
- Transparent AI reasoning (thinking blocks visible to users)
- Automatic citation generation with source tracking
- Split-view interface showing chat and search results simultaneously

---

## User Journey Map

### Stage 1: Landing (First Impression)

**User Actions:**
- Arrives at the application
- Views hero section with "Open Researcher" branding
- Sees input field with placeholder text

**Touchpoints:**
- Header with Firecrawl logo (links to firecrawl.dev)
- GitHub "Use this template" button
- Central hero title with gradient styling
- Subtitle: "Firecrawl-powered search, scrape, and agentic reasoning"
- Search input with orange submit button

**Emotional State:** Curious, potentially uncertain about capabilities

**Technical Implementation:**
```
File: app/open-researcher/open-researcher-content.tsx
Lines: 88-166

Key elements:
- Hero section with animated fade-up (500ms delay)
- Search input with rounded-full styling
- Footer with Firecrawl attribution
```

### Stage 2: API Key Setup (If Required)

**Trigger:** User attempts search without Firecrawl API key configured

**User Actions:**
- Modal appears prompting for API key
- User can click to get API key from Firecrawl
- User enters API key in password field
- Submits for validation

**Touchpoints:**
- Modal dialog with clear title "Firecrawl API Key Required"
- External link button to Firecrawl website
- Password input field with "fc-..." placeholder
- Submit button with loading state

**Emotional State:** Potential friction point, but clear guidance provided

**Technical Implementation:**
```
File: app/open-researcher/open-researcher-content.tsx
Lines: 169-223

Key elements:
- Dialog component from Radix UI
- API key validation against /api/scrape endpoint
- localStorage persistence of valid key
- Toast notifications for success/error
```

### Stage 3: Query Input

**User Actions:**
- Focus on input field (triggers suggestions)
- View suggested queries
- Type custom query or select suggestion
- Submit query

**Touchpoints:**
- Input field with focus ring (orange-500)
- Animated suggestion dropdown
- Three pre-defined example queries
- Send button with icon

**Suggested Queries Available:**
1. "What are the latest AI breakthroughs in 2025..."
2. "Find me the 2nd sentence of the 3rd and 5th blog post on firecrawl.dev..."
3. "Compare the latest features and pricing between Samsung Galaxy S24 Ultra and iPhone 15 Pro Max..."

**Emotional State:** Engaged, exploring capabilities

**Technical Implementation:**
```
File: components/thinking-chat.tsx
Lines: 24-28, 329-398

Key behaviors:
- onFocus shows suggestions
- onBlur hides suggestions (200ms delay for click capture)
- Staggered animation delays for suggestions (300ms + idx * 80ms)
- Click handler fills input and focuses field
```

### Stage 4: Research in Progress

**User Actions:**
- Observes transition animation
- Views split-screen layout appear
- Monitors thinking blocks and tool calls
- Watches search results populate
- Sees screenshots of pages being analyzed

**Touchpoints:**
- User message bubble (orange background)
- Thinking block displays with blue indicator
- Tool call displays (Web Search, Deep Scrape)
- Browser-style search results panel
- Screenshot scanning animation

**Emotional State:** Anticipation, engagement with visible progress

**Technical Implementation:**
```
File: components/thinking-chat.tsx
Lines: 402-591

Split layout structure:
- Left: Chat interface (45vh mobile, 50% desktop)
- Right: Search results display (45vh mobile, 50% desktop)

Message types displayed:
- Thinking blocks (blue dot indicator)
- Tool calls (purple for search, orange for scrape)
- Tool results (green dot, shows duration)
```

### Stage 5: Results Review

**User Actions:**
- Reads AI-generated response
- Hovers over citations to see source details
- Clicks links to open sources
- Copies response to clipboard
- Submits follow-up questions

**Touchpoints:**
- Markdown-rendered response
- Superscript citation numbers [1], [2], etc.
- Citation tooltip on hover
- Copy button for response
- Continued chat input

**Emotional State:** Satisfaction (if results good), potentially needing clarification

**Technical Implementation:**
```
File: components/markdown-renderer.tsx
File: components/citation-tooltip.tsx

Citation handling:
- Citations parsed as [number] pattern
- Hover triggers tooltip with source title, URL, description
- Favicon displayed via Google's favicon service
- 200ms delay before hiding tooltip
```

---

## Interaction Points

### Primary Interactions

| Interaction | Element | Behavior | Feedback |
|-------------|---------|----------|----------|
| Search Submit | Input + Button | POST to /api/open-researcher | Layout transition, loading state |
| Suggestion Click | Button | Fills input, focuses field | Visual feedback on hover |
| Copy Response | Copy Icon | Clipboard write | No toast (silent) |
| View Source | Citation Hover | Shows tooltip | Tooltip with source details |
| Open Source | Link Click | Opens in new tab | Standard link behavior |
| Close Browser Panel | Red dot | Animated cursor, panel closes | Full-width chat |

### Secondary Interactions

| Interaction | Element | Behavior | Feedback |
|-------------|---------|----------|----------|
| API Key Entry | Modal Input | Validates key | Toast success/error |
| Get API Key | External Link | Opens Firecrawl site | New tab |
| View Screenshot | Thumbnail | Opens modal | Full-size view with scanning animation |
| GitHub Link | Header Button | Opens repository | New tab |

---

## Feedback Mechanisms

### Visual Feedback

#### 1. Animation System
The application uses a comprehensive animation system defined in `globals.css`:

| Animation | Duration | Usage |
|-----------|----------|-------|
| fade-up | 500ms | Hero text, suggestions |
| fade-in | 500ms | Messages, content |
| slide-up | 700ms | Layout transitions |
| slide-in-right | 500ms | Response panel |
| scale-in-content | 500ms | Modal content |

#### 2. Color-Coded Indicators

| Color | Meaning |
|-------|---------|
| Blue dot | Thinking block |
| Purple dot | Web search in progress |
| Orange dot | Deep scrape in progress |
| Green dot | Results received |
| Orange pulse | Active searching/scraping |

#### 3. Loading States

**Input Button:**
- Enabled: Orange background, send icon
- Loading: Spinning Loader2 icon
- Disabled: 50% opacity

**Search Results Panel:**
- URL bar shows current action (Searching.../Scraping...)
- Animated pulse dots next to status text
- Scanner line animation over screenshots

### Auditory Feedback
None implemented (silent operation)

### Haptic Feedback
None implemented (web-only)

### Toast Notifications

```typescript
// Success messages
toast.success('API key saved successfully!')

// Error messages
toast.error('Please enter a valid Firecrawl API key')
toast.error('Invalid API key. Please check and try again.')
```

---

## Loading and Progress States

### State 1: Initial Load
- Page renders with static content
- API key check happens in useEffect
- No visible loading indicator

### State 2: Query Submission

**Transition Animation (300ms):**
```typescript
setIsTransitioning(true)
await new Promise(resolve => setTimeout(resolve, 300))
// Content updates
setIsTransitioning(false)
```

**Visual Changes:**
- Hero section fades and collapses
- Split-screen layout animates in
- User message appears immediately
- Assistant placeholder with "Researching..." appears

### State 3: Active Research

**Browser Panel URL Bar States:**

| State | Icon | Text | Indicator |
|-------|------|------|-----------|
| Searching | Search | "Searching: {query}" | Blue pulse + "Searching..." |
| Scraping | FileText | URL being scraped | Orange pulse + "Scraping..." |
| Idle | Globe | Empty | None |

**Chat Panel Progress:**

Thinking events stream in real-time via Server-Sent Events (SSE):
```
data: {"type": "event", "event": {...}}
data: {"type": "response", "content": "..."}
data: {"type": "done"}
```

Each event type renders differently:
- `thinking`: Shows AI reasoning text
- `tool_call`: Shows tool name and parameters
- `tool_result`: Shows results preview and duration

### State 4: Screenshot Analysis

**Scanning Animation Components:**
1. Scanner line: Orange gradient, 2s animation duration
2. Grid overlay: Subtle repeating pattern
3. Corner indicators: Pulsing border corners
4. Status badge: "Scanning page content" with animated dots

**Image Loading Sequence:**
1. Loading spinner displayed
2. Image preloaded off-screen
3. Tall image detection (1.5x container height)
4. Scroll animation if tall (40s duration)
5. Scanner overlay applied

### State 5: Completion

**Final Response Rendering:**
- Markdown content parsed and rendered
- Citations become interactive superscripts
- Copy button appears
- Input re-enables for follow-up

---

## Error Handling

### Error Categories and User Messages

#### 1. API Configuration Errors

| Error Type | User Message | Action |
|------------|--------------|--------|
| Missing ANTHROPIC_API_KEY | "The Anthropic API key is not configured. Please contact the site administrator." | Contact admin |
| Missing FIRECRAWL_API_KEY | "The Firecrawl API key is not configured. Please contact the site administrator." | Add via modal |
| Invalid API Key | "Invalid API key. Please check and try again." | Re-enter key |

#### 2. Model/Feature Errors

| Error Type | User Message |
|------------|--------------|
| Model unavailable | "The required AI model is not available. This feature may not be accessible in your region." |
| Beta feature access | "The interleaved thinking feature requires special API access. Please contact support." |

#### 3. Generic Errors

Default fallback: "Sorry, an error occurred while searching. Please try again."

### Error Presentation

Errors appear in the assistant message area:
```typescript
setMessages(prev => prev.map(msg =>
  msg.id === assistantMessage.id
    ? { ...msg, content: errorMessage }
    : msg
))
```

### Error Recovery Paths

1. **API Key Invalid:** Modal allows re-entry
2. **Search Failed:** User can submit new query
3. **Network Error:** Refresh page, retry

### Search Results Error States

When no results found:
```
Your search - {query} - did not match any documents.

Suggestions:
- Make sure all words are spelled correctly.
- Try different keywords.
- Try more general keywords.
```

---

## Mobile vs Desktop Experience

### Responsive Breakpoints

The application uses Tailwind's responsive system with `lg:` (1024px) as primary breakpoint.

### Layout Differences

#### Landing Page

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Hero Title | text-[2.5rem] | text-[3.8rem] |
| Container Padding | px-4 | px-6 lg:px-8 |
| Input Container | mt-4, px-4 | mt-8, px-0 |

#### Research View (Split Layout)

| Aspect | Mobile | Desktop |
|--------|--------|---------|
| Layout Direction | flex-col-reverse | flex-row |
| Chat Panel | Bottom, h-[45vh] | Left, w-1/2, full height |
| Browser Panel | Top, h-[45vh] | Right, w-1/2, full height |
| Total Height | calc(100vh-120px) | calc(100vh-200px) |

```typescript
// Layout implementation
<div className="flex flex-col-reverse lg:flex-row gap-2 lg:gap-4
               h-[calc(100vh-120px)] lg:h-[calc(100vh-200px)]">
```

### Touch Considerations

- Input fields: h-12 (48px) for comfortable touch targets
- Buttons: h-8 w-8 minimum (32px)
- Suggestion items: Full-width with p-3 padding
- Message bubbles: max-w-[85%] mobile, max-w-[80%] desktop

### Scroll Behavior

Both panels have independent scroll:
```css
.flex-1.overflow-y-auto
```

Auto-scroll to new messages:
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])
```

### Typography Scaling

| Element | Mobile | Desktop |
|---------|--------|---------|
| User messages | text-sm | text-sm |
| Thinking blocks | px-3 py-2 | px-4 py-3 |
| Search result titles | text-xl | text-xl |
| URL bar text | truncated aggressively | full display |

### Mobile-Specific Behaviors

1. **Search Box Truncation:** Query limited to 30 chars on mobile
```typescript
<span className="lg:hidden">
  {query ? (query.length > 30 ? query.substring(0, 30) + '...' : query) : 'Search...'}
</span>
```

2. **Panel Priority:** Browser panel on top (mobile), so users see activity first

3. **Reduced Spacing:** gap-2 mobile vs gap-4 desktop

### Dark Mode Support

Full dark mode support via Tailwind's dark: variant:
- Backgrounds: bg-white dark:bg-gray-900
- Text: text-gray-700 dark:text-gray-300
- Borders: border-gray-200 dark:border-gray-700
- Focus rings: ring-orange-500 dark:ring-orange-400

---

## Component Breakdown

### Core Components

| Component | File | Purpose |
|-----------|------|---------|
| OpenResearcherContent | open-researcher-content.tsx | Main page layout, state management |
| ThinkingChat | thinking-chat.tsx | Chat interface, message handling |
| SearchResultsDisplay | search-results-display.tsx | Browser panel, results rendering |
| MarkdownRenderer | markdown-renderer.tsx | Response formatting |
| CitationTooltip | citation-tooltip.tsx | Source attribution UI |
| ScreenshotPreview | screenshot-preview.tsx | Page screenshot display |
| AnimatedCursor | animated-cursor.tsx | Browser close animation |

### UI Components (Radix-based)

| Component | Usage |
|-----------|-------|
| Dialog | API key modal, screenshot full view |
| Button | Actions with variants (code, orange) |
| Input | Text fields |
| Tooltip | Optional tooltips |

### State Flow

```
User Input
    |
    v
ThinkingChat.handleSearch()
    |
    v
POST /api/open-researcher
    |
    v
SSE Stream (events)
    |
    v
State Updates:
- messages[]
- searchResults[]
- screenshots[]
- isSearching
    |
    v
UI Re-renders
```

---

## UX Improvement Opportunities

### Identified Friction Points

1. **API Key Setup:** Required step creates barrier; consider trial mode
2. **No Cancel Button:** Users cannot stop in-progress searches
3. **Silent Copy:** No toast confirmation when copying response
4. **No History:** Conversation lost on page refresh
5. **Limited Error Recovery:** Some errors require page refresh

### Accessibility Considerations

Current implementation:
- Focus visible states on inputs
- ARIA labels on close buttons ("Close")
- Keyboard support for Enter to submit

Potential improvements:
- Screen reader announcements for streaming events
- Reduced motion preferences for animations
- More comprehensive ARIA labeling

### Performance Notes

- Images lazy-loaded with Next.js Image component
- Animations use GPU-accelerated properties (transform, opacity)
- SSE for real-time updates (vs polling)
- Memoized MarkdownRenderer component

---

## Appendix: Animation Keyframes Reference

```css
/* Key animations from globals.css */

@keyframes fade-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scanner {
  0% { top: 0; }
  100% { top: 100%; }
}

@keyframes selection-pulse-green {
  0%, 100% {
    border-color: rgba(34, 197, 94, 1);
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    border-color: rgba(34, 197, 94, 0.7);
    box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
  }
}

@keyframes screenshot-scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(calc(-100% + 100vh)); }
}
```

---

*Document generated: 2026-01-06*
*Application version: 0.1.0*
