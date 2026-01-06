# Code Style and Conventions

## TypeScript
- Strict TypeScript with explicit types
- Interfaces preferred for object types
- Async/await for asynchronous code

## React
- Functional components with hooks
- Client components marked with "use client"
- Server components used in App Router by default

## File Naming
- kebab-case for files (e.g., `thinking-chat.tsx`)
- PascalCase for components (e.g., `ThinkingChat`)
- camelCase for functions and variables

## Component Structure
- UI components in `components/ui/` (shadcn)
- Feature components in `components/`
- Page components in `app/` directories

## API Routes
- Using Next.js App Router API routes (route.ts)
- Server-Sent Events (SSE) for streaming responses
- JSON for request/response bodies
