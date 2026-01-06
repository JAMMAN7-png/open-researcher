# Code Style & Conventions

## TypeScript
- Strict mode enabled in tsconfig.json
- Path alias: `@/*` maps to project root
- ES2017 target, ESNext modules
- Interface-based type definitions (not type aliases for complex types)

## React Components
- Functional components with hooks
- 'use client' directive for client components
- File naming: kebab-case (e.g., `thinking-chat.tsx`)
- Component naming: PascalCase
- Props interfaces named `{ComponentName}Props`

## Styling
- Tailwind CSS utility classes
- HSL CSS variables for theming
- Dark mode via `dark:` variants
- `cn()` utility from `lib/utils.ts` for class merging

## API Routes
- Next.js App Router format: `app/api/*/route.ts`
- Export named functions: `GET`, `POST`, etc.
- Use `NextRequest`/`NextResponse` from `next/server`
- Error handling with try-catch and JSON responses

## State Management
- React useState/useEffect hooks
- No external state library
- LocalStorage for client-side persistence (API keys)

## ESLint
- next/core-web-vitals preset
- next/typescript preset
