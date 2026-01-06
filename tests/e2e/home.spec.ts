import { test, expect, setupMockApiKey } from '../fixtures/test-fixtures';

test.describe('Home Page - Landing', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('should display the main heading', async ({ homePage }) => {
    await expect(homePage.heading).toBeVisible();
    await expect(homePage.heading).toContainText('Open Researcher');
  });

  test('should display the subtitle', async ({ homePage }) => {
    await expect(homePage.subtitle).toBeVisible();
    await expect(homePage.subtitle).toContainText('Firecrawl-powered search');
  });

  test('should display the Firecrawl logo', async ({ homePage }) => {
    await expect(homePage.logo).toBeVisible();
  });

  test('should display the GitHub template link', async ({ homePage }) => {
    await expect(homePage.githubLink).toBeVisible();
    await expect(homePage.githubLink).toHaveAttribute('href', /github\.com/);
    await expect(homePage.githubLink).toHaveAttribute('target', '_blank');
  });

  test('should display the footer with Firecrawl link', async ({ homePage }) => {
    await expect(homePage.firecrawlFooterLink).toBeVisible();
    await expect(homePage.firecrawlFooterLink).toHaveAttribute('href', 'https://firecrawl.dev');
  });
});

test.describe('Home Page - Search Input', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should have a search input field', async ({ homePage }) => {
    await expect(homePage.searchInput).toBeVisible();
    await expect(homePage.searchInput).toHaveAttribute('placeholder', /enter query/i);
  });

  test('should have a disabled submit button when input is empty', async ({ homePage }) => {
    await expect(homePage.submitButton).toBeDisabled();
  });

  test('should enable submit button when text is entered', async ({ homePage }) => {
    await homePage.typeQuery('test query');
    await expect(homePage.submitButton).toBeEnabled();
  });

  test('should show suggested queries when input is focused', async ({ homePage }) => {
    await homePage.focusSearchInput();

    // Wait for suggestions to appear with animation
    await homePage.page.waitForTimeout(500);

    const suggestions = await homePage.suggestedQueries.count();
    expect(suggestions).toBeGreaterThan(0);
  });

  test('should fill input when suggestion is clicked', async ({ homePage }) => {
    await homePage.focusSearchInput();
    await homePage.page.waitForTimeout(500);

    // Get the first suggestion's text
    const firstSuggestion = homePage.suggestedQueries.first();
    const suggestionText = await firstSuggestion.textContent();

    await firstSuggestion.click();

    await expect(homePage.searchInput).toHaveValue(suggestionText || '');
  });
});

test.describe('Home Page - Responsive Design', () => {
  test('should display correctly on mobile viewport', async ({ page, homePage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.searchInput).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page, homePage }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.searchInput).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page, homePage }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await homePage.goto();

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.searchInput).toBeVisible();
  });
});

test.describe('Home Page - Dark Mode', () => {
  test('should respect system dark mode preference', async ({ page, homePage }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await homePage.goto();

    // Check that the page renders (dark mode CSS should be applied)
    await expect(homePage.heading).toBeVisible();
  });

  test('should respect system light mode preference', async ({ page, homePage }) => {
    // Emulate light color scheme
    await page.emulateMedia({ colorScheme: 'light' });
    await homePage.goto();

    // Check that the page renders
    await expect(homePage.heading).toBeVisible();
  });
});

test.describe('Home Page - With API Key', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockApiKey(page);
  });

  test('should allow search when API key is set', async ({ homePage }) => {
    await homePage.goto();
    await homePage.typeQuery('test query');

    // Button should be enabled when there is text and API key
    await expect(homePage.submitButton).toBeEnabled();
  });
});
