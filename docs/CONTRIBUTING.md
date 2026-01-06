# Contributing to Open Researcher

Thank you for your interest in contributing to Open Researcher! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing Guidelines](#testing-guidelines)
7. [Commit Guidelines](#commit-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Documentation](#documentation)

## Code of Conduct

Please read and follow our code of conduct. Be respectful, inclusive, and considerate in all interactions.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Git
- An Anthropic API key (for AI functionality)
- A Firecrawl API key (for web scraping, optional)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/open-researcher
   cd open-researcher
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/mendableai/open-researcher
   ```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
ANTHROPIC_API_KEY=sk-ant-...
FIRECRAWL_API_KEY=fc-...  # Optional
```

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Install Playwright Browsers (for testing)

```bash
npx playwright install
```

## Development Workflow

### Branch Naming

Use descriptive branch names:

- `feature/` - New features (e.g., `feature/add-export-button`)
- `fix/` - Bug fixes (e.g., `fix/search-results-loading`)
- `docs/` - Documentation updates (e.g., `docs/update-api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-agent-logic`)
- `test/` - Test additions/improvements (e.g., `test/add-e2e-tests`)

### Creating a Feature Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull upstream main

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Keeping Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

## Coding Standards

### TypeScript

- Use explicit types for function parameters and return values
- Avoid `any` - prefer `unknown` with type guards
- Use interfaces for object shapes, types for unions/intersections
- Enable strict mode (`"strict": true` in tsconfig.json)

```typescript
// Good
interface SearchResult {
  title: string;
  url: string;
  description?: string;
}

function parseResults(data: unknown): SearchResult[] {
  if (!Array.isArray(data)) return [];
  // ...
}

// Avoid
function parseResults(data: any): any[] {
  // ...
}
```

### React Components

- Use functional components with hooks
- Use `'use client'` directive for client components
- Destructure props with TypeScript interfaces
- Use `cn()` utility for conditional classNames

```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  isActive?: boolean
  className?: string
}

export function MyComponent({ title, isActive, className }: MyComponentProps) {
  const [state, setState] = useState(false)

  return (
    <div className={cn(
      "base-classes",
      isActive && "active-classes",
      className
    )}>
      {title}
    </div>
  )
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first responsive design (`sm:`, `md:`, `lg:`)
- Support dark mode with `dark:` prefix
- Use CSS variables for theme values

```typescript
// Good - mobile-first with dark mode support
className="px-4 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"

// Good - responsive design
className="text-sm md:text-base lg:text-lg"
```

### File Organization

- Components: `components/` directory
- UI primitives: `components/ui/` directory
- Business logic: `lib/` directory
- API routes: `app/api/` directory
- Tests: `tests/` directory

### Naming Conventions

- **Components**: PascalCase (`ThinkingChat.tsx`)
- **Files**: kebab-case (`thinking-chat.tsx`)
- **Functions**: camelCase (`handleSearch`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RESULTS`)
- **Types/Interfaces**: PascalCase (`SearchResult`)

## Testing Guidelines

### Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run tests for specific browser
npx playwright test --project=chromium

# View test report
npx playwright show-report
```

### Writing Tests

Use the Page Object Model pattern:

```typescript
// tests/pages/my-feature.page.ts
import { type Page, type Locator } from '@playwright/test';

export class MyFeaturePage {
  readonly page: Page;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async goto() {
    await this.page.goto('/my-feature');
  }

  async submit() {
    await this.submitButton.click();
  }
}

// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';
import { MyFeaturePage } from '../pages/my-feature.page';

test.describe('My Feature', () => {
  let myFeaturePage: MyFeaturePage;

  test.beforeEach(async ({ page }) => {
    myFeaturePage = new MyFeaturePage(page);
    await myFeaturePage.goto();
  });

  test('should submit successfully', async () => {
    await myFeaturePage.submit();
    await expect(myFeaturePage.page).toHaveURL(/success/);
  });
});
```

### Accessibility Testing

Include accessibility checks in your tests:

```typescript
import AxeBuilder from '@axe-core/playwright';

test('should have no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## Commit Guidelines

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Good commit messages
git commit -m "feat(search): add date filter to search results"
git commit -m "fix(chat): resolve scroll-to-bottom issue on new messages"
git commit -m "docs: update API documentation for new endpoints"
git commit -m "test: add E2E tests for API key modal"
git commit -m "refactor(agent): extract common tool execution logic"
```

## Pull Request Process

### Before Submitting

1. **Update your branch**: Rebase on latest main
2. **Run linting**: `npm run lint`
3. **Run tests**: `npx playwright test`
4. **Update documentation**: If your changes affect documentation

### Creating a Pull Request

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill out the PR template with:
   - Description of changes
   - Related issue (if any)
   - Screenshots (for UI changes)
   - Testing performed

### PR Title Format

Use conventional commit format:

```
feat(component): add new feature
fix(api): resolve error handling issue
docs: update contributing guidelines
```

### Review Process

- All PRs require at least one review
- Address review feedback promptly
- Keep discussions focused and constructive
- Squash commits when merging if requested

## Documentation

### When to Update Docs

- New features require documentation
- API changes require updated API docs
- Bug fixes may need troubleshooting updates
- Refactoring may need architecture updates

### Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Project overview and quick start |
| `CLAUDE.md` | Detailed technical documentation |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/RESEARCH_FLOW.md` | Research workflow |
| `docs/UX-DOCUMENTATION.md` | User experience |
| `docs/VISUAL_DESIGN_SYSTEM.md` | Design system |
| `docs/TESTING.md` | Testing guide |
| `docs/CONTRIBUTING.md` | This file |

### Documentation Style

- Use clear, concise language
- Include code examples where helpful
- Keep documentation up to date with code
- Use proper Markdown formatting

## Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the docs folder for detailed guides

Thank you for contributing to Open Researcher!
