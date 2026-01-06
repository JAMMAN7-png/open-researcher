# Testing Guide

This guide covers the testing infrastructure and practices for Open Researcher.

## Table of Contents

1. [Overview](#overview)
2. [Test Architecture](#test-architecture)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Page Object Model](#page-object-model)
6. [Accessibility Testing](#accessibility-testing)
7. [Test Configuration](#test-configuration)
8. [CI/CD Integration](#cicd-integration)
9. [Best Practices](#best-practices)

## Overview

Open Researcher uses **Playwright** for end-to-end (E2E) testing. The test suite covers:

- UI interactions and user flows
- Cross-browser compatibility
- Mobile responsiveness
- Accessibility compliance

### Technology Stack

| Tool | Purpose |
|------|---------|
| Playwright | E2E testing framework |
| @axe-core/playwright | Accessibility testing |
| Page Object Model | Test organization pattern |

## Test Architecture

```
tests/
├── e2e/                    # End-to-end test files
│   ├── home.spec.ts        # Home page tests
│   ├── chat.spec.ts        # Chat interface tests
│   ├── api-key.spec.ts     # API key modal tests
│   └── accessibility.spec.ts  # A11y tests
├── fixtures/               # Test fixtures and data
│   └── test-data.ts        # Shared test data
└── pages/                  # Page Object Models
    ├── home.page.ts        # Home page interactions
    ├── chat.page.ts        # Chat page interactions
    └── api-key-modal.page.ts  # API key modal interactions
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests with UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/home.spec.ts

# Run tests matching pattern
npx playwright test -g "should display"
```

### Browser Selection

```bash
# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in mobile viewport
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Run in all browsers
npx playwright test
```

### Debug Mode

```bash
# Debug with Playwright Inspector
npx playwright test --debug

# Debug specific test
npx playwright test tests/e2e/home.spec.ts --debug

# Pause on first test
PWDEBUG=1 npx playwright test
```

### Test Reports

```bash
# View HTML report
npx playwright show-report

# Generate JSON report
npx playwright test --reporter=json

# Generate JUnit report (for CI)
npx playwright test --reporter=junit
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const element = page.getByRole('button', { name: /submit/i });

    // Act
    await element.click();

    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

### Using Page Objects

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Home Page', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display heading', async () => {
    await expect(homePage.heading).toBeVisible();
  });

  test('should allow search', async () => {
    await homePage.typeQuery('test query');
    await homePage.submitSearch();
    await expect(homePage.page).toHaveURL(/search/);
  });
});
```

### Assertions

```typescript
// Visibility
await expect(element).toBeVisible();
await expect(element).toBeHidden();

// Text content
await expect(element).toHaveText('Expected text');
await expect(element).toContainText('partial');

// Attributes
await expect(element).toHaveAttribute('href', '/path');
await expect(element).toHaveClass(/active/);

// Input values
await expect(input).toHaveValue('expected value');
await expect(input).toBeEmpty();

// Page state
await expect(page).toHaveURL(/pattern/);
await expect(page).toHaveTitle(/pattern/);

// Count
await expect(elements).toHaveCount(5);
```

### Waiting and Timeouts

```typescript
// Wait for element
await element.waitFor({ state: 'visible' });
await element.waitFor({ state: 'hidden', timeout: 10000 });

// Wait for network
await page.waitForResponse(response =>
  response.url().includes('/api/search') && response.status() === 200
);

// Wait for navigation
await Promise.all([
  page.waitForNavigation(),
  button.click()
]);

// Custom wait
await page.waitForFunction(() => document.querySelector('.loaded'));
```

## Page Object Model

### Creating a Page Object

```typescript
// tests/pages/feature.page.ts
import { type Page, type Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;

  // Locators
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;
  readonly resultsList: Locator;

  constructor(page: Page) {
    this.page = page;

    // Use semantic locators (role, label, placeholder)
    this.heading = page.getByRole('heading', { name: /feature/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.submitButton = page.getByRole('button', { name: /submit/i });
    this.resultsList = page.getByRole('list');
  }

  // Navigation
  async goto() {
    await this.page.goto('/feature');
  }

  // Actions
  async search(query: string) {
    await this.searchInput.fill(query);
    await this.submitButton.click();
  }

  async waitForResults() {
    await this.resultsList.waitFor({ state: 'visible' });
  }

  // Getters
  async getResultCount(): Promise<number> {
    return await this.resultsList.locator('li').count();
  }
}
```

### Existing Page Objects

#### HomePage

```typescript
// tests/pages/home.page.ts
export class HomePage {
  readonly page: Page;
  readonly logo: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;
  readonly suggestedQueries: Locator;
  readonly githubLink: Locator;
  readonly firecrawlFooterLink: Locator;

  async goto(): Promise<void>;
  async waitForLoad(): Promise<void>;
  async typeQuery(query: string): Promise<void>;
  async submitSearch(): Promise<void>;
  async clickSuggestion(index: number): Promise<void>;
  async focusSearchInput(): Promise<void>;
}
```

#### ChatPage

```typescript
// tests/pages/chat.page.ts
export class ChatPage {
  readonly page: Page;
  readonly chatContainer: Locator;
  readonly messagesArea: Locator;
  readonly searchInput: Locator;
  readonly submitButton: Locator;
  readonly userMessages: Locator;
  readonly assistantMessages: Locator;
  readonly loadingIndicator: Locator;
  readonly errorMessage: Locator;
  readonly copyButton: Locator;
  readonly browserPanel: Locator;

  async typeQuery(query: string): Promise<void>;
  async submitQuery(): Promise<void>;
  async submitQueryWithText(query: string): Promise<void>;
  async waitForResponse(): Promise<void>;
  async getUserMessageCount(): Promise<number>;
  async getAssistantMessageCount(): Promise<number>;
  async isLoading(): Promise<boolean>;
  async copyLastResponse(): Promise<void>;
}
```

#### ApiKeyModalPage

```typescript
// tests/pages/api-key-modal.page.ts
export class ApiKeyModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly dialogDescription: Locator;
  readonly apiKeyInput: Locator;
  readonly submitButton: Locator;
  readonly getApiKeyButton: Locator;
  readonly closeButton: Locator;

  async waitForVisible(): Promise<void>;
  async waitForHidden(): Promise<void>;
  async isVisible(): Promise<boolean>;
  async enterApiKey(key: string): Promise<void>;
  async submit(): Promise<void>;
  async closeModal(): Promise<void>;
}
```

## Accessibility Testing

### Using axe-core

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page should have no violations', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('chat page should have no violations', async ({ page }) => {
    await page.goto('/open-researcher');

    const results = await new AxeBuilder({ page })
      .include('.chat-container')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Excluding Known Issues

```typescript
const results = await new AxeBuilder({ page })
  .exclude('.third-party-widget')  // Exclude elements
  .disableRules(['color-contrast']) // Disable specific rules
  .analyze();
```

### Checking Specific Rules

```typescript
const results = await new AxeBuilder({ page })
  .withRules(['button-name', 'image-alt', 'link-name'])
  .analyze();
```

## Test Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // Desktop browsers
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    // Mobile browsers
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npx playwright test
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Best Practices

### Do

- Use semantic locators (`getByRole`, `getByLabel`, `getByPlaceholder`)
- Write independent tests (no shared state)
- Use Page Object Model for maintainability
- Test user flows, not implementation details
- Include accessibility tests
- Keep tests fast (< 30 seconds each)
- Use meaningful test names

### Don't

- Don't use fragile selectors (CSS classes, XPath)
- Don't rely on test order
- Don't test third-party libraries
- Don't hard-code test data
- Don't ignore flaky tests (fix them)
- Don't duplicate test logic

### Example of Good vs Bad

```typescript
// Good - semantic locator
const button = page.getByRole('button', { name: /submit/i });

// Bad - CSS selector
const button = page.locator('.btn-primary');

// Good - user-centric action
await page.getByLabel('Email').fill('test@example.com');

// Bad - implementation detail
await page.locator('#email-input-field').fill('test@example.com');

// Good - meaningful test name
test('should show error when email is invalid', async () => {});

// Bad - vague test name
test('test 1', async () => {});
```

## Troubleshooting

### Common Issues

**Tests failing in CI but passing locally:**
- Check for timing issues (add explicit waits)
- Verify environment variables are set
- Check network timeouts

**Flaky tests:**
- Use `waitFor` instead of fixed timeouts
- Ensure proper test isolation
- Check for race conditions

**Slow tests:**
- Minimize page navigations
- Use test fixtures for setup
- Parallelize independent tests

### Debug Tips

```bash
# Enable debug logging
DEBUG=pw:api npx playwright test

# Run with slow-mo
npx playwright test --project=chromium -- --slow-mo=500

# Record video
npx playwright test --video=on
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Page Object Model](https://playwright.dev/docs/pom)
