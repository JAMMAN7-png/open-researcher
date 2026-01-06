# Code Style and Conventions

## TypeScript
- Strict TypeScript with explicit types
- Interface definitions for component props and API types
- Use of type assertions where needed for API responses

## React Patterns
- Functional components with hooks
- 'use client' directive for client components
- useState for local state management
- useEffect for side effects and initialization

## File Naming
- Components: PascalCase (ThinkingChat.tsx)
- Utilities: camelCase (utils.ts)
- Routes: lowercase with hyphens (open-researcher)

## Import Organization
1. React/Next.js imports
2. Third-party libraries
3. Internal components (@/components)
4. Internal utilities (@/lib)

## API Design
- Next.js App Router API routes
- SSE (Server-Sent Events) for streaming responses
- JSON for request/response bodies
- Custom headers for API keys (X-Firecrawl-API-Key)

## UI Patterns
- Tailwind CSS for styling
- shadcn/ui for base components
- Dark mode support via CSS classes
- Responsive design (mobile-first)
