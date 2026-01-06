# Code Style and Conventions

## TypeScript
- **Strict mode enabled**: All TypeScript strict checks are enforced
- **Target**: ES2017
- **Module resolution**: bundler (Next.js optimized)
- **Type hints**: Always use explicit types for function parameters and return values
- **Interfaces**: Prefer interfaces over types for object shapes
- **Path aliases**: Use `@/*` for imports (maps to project root)

## React/Next.js Conventions
- **Components**: Use functional components with hooks (no class components)
- **Client Components**: Explicitly mark with `'use client'` directive at top of file
- **Server Components**: Default for files without `'use client'` directive
- **Naming**:
  - Components: PascalCase (e.g., `ThinkingChat`, `SearchResultsDisplay`)
  - Files: kebab-case for pages, PascalCase or kebab-case for components
  - Variables/Functions: camelCase
- **Props**: Use TypeScript interfaces for component props
- **Hooks**: Follow React hooks rules and conventions

## File Structure
```
app/                    # Next.js App Router
  api/                 # API route handlers
  open-researcher/     # Application pages
  layout.tsx           # Root layout (Server Component)
  page.tsx             # Home page (Server Component)
components/            # React components
  ui/                 # Reusable UI components
  thinking-chat.tsx   # Feature components
lib/                  # Utility functions and shared logic
public/               # Static assets
```

## Component Patterns
- **UI Components**: Located in `components/ui/` (button, dialog, input, etc.)
- **Feature Components**: Located in `components/` root (thinking-chat, markdown-renderer, etc.)
- **Layouts**: Use Next.js layout.tsx for shared layouts
- **API Routes**: Use route handlers in `app/api/*/route.ts`

## Styling
- **Tailwind CSS v4**: Utility-first CSS framework
- **Class merging**: Use `cn()` utility from `lib/utils.ts` for conditional classes
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Dark mode**: Support via Tailwind's dark mode classes
- **Animations**: Use Tailwind CSS animations and custom CSS animations

## State Management
- **Local state**: `useState` hook
- **Side effects**: `useEffect` hook
- **Refs**: `useRef` for DOM references
- **No global state library**: Uses React's built-in hooks and context

## API Integration
- **Streaming responses**: Use `ReadableStream` for Server-Sent Events (SSE)
- **Error handling**: Always handle errors with try-catch and user-friendly messages
- **Headers**: Use custom headers for API key passing (e.g., `X-Firecrawl-API-Key`)

## Naming Patterns
- Routes: Follow Next.js App Router conventions (folders with page.tsx)
- API Routes: `/api/<feature>/route.ts`
- Components: Descriptive names indicating purpose
- Utilities: Clear, single-responsibility functions
