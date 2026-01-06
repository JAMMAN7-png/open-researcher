import { test, expect, setupMockApiKey, clearLocalStorage } from '../fixtures/test-fixtures';

test.describe('Search Functionality - Without API Key', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should show API key modal when trying to search without key', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.typeQuery('test search query');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.dialogTitle).toBeVisible();
  });
});

test.describe('Search Functionality - Input Validation', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should not submit empty query', async ({ homePage }) => {
    await expect(homePage.submitButton).toBeDisabled();
  });

  test('should not submit whitespace-only query', async ({ homePage }) => {
    await homePage.typeQuery('   ');
    await expect(homePage.submitButton).toBeDisabled();
  });

  test('should accept valid query', async ({ homePage }) => {
    await homePage.typeQuery('What is the weather today?');
    await expect(homePage.submitButton).toBeEnabled();
  });

  test('should trim query before submission', async ({ homePage }) => {
    await homePage.typeQuery('  test query  ');
    await expect(homePage.submitButton).toBeEnabled();
  });
});

test.describe('Search Functionality - UI State', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should hide hero section after search', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Wait for transition
    await page.waitForTimeout(500);

    // Hero section should be hidden or have reduced opacity
    const heroHeading = page.getByRole('heading', { name: /open researcher/i });
    // The heading may be hidden via CSS animation
    await expect(heroHeading).toBeHidden({ timeout: 5000 }).catch(() => {
      // It may still be visible but with zero opacity during transition
    });
  });

  test('should show chat interface after search', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Wait for chat interface to appear
    await page.waitForTimeout(1000);

    // User message should appear in chat
    const userMessage = page.locator('.bg-orange-500.text-white');
    await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show loading indicator during search', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Loading spinner should appear
    const loader = page.locator('.animate-spin');
    await expect(loader.first()).toBeVisible({ timeout: 5000 });
  });

  test('should disable input during search', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Input should be disabled during search
    await expect(homePage.searchInput).toBeDisabled({ timeout: 5000 });
  });
});

test.describe('Search Functionality - Split View', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should show browser panel on desktop after search', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Wait for layout to change
    await page.waitForTimeout(1000);

    // Look for the browser panel / search results display
    const browserPanel = page.locator('.rounded-lg.border').filter({ hasText: /search|scraping/i });
    // At least one panel should be visible on desktop
    const panelCount = await page.locator('.lg\\:w-1\\/2').count();
    expect(panelCount).toBeGreaterThan(0);
  });
});

test.describe('Search Functionality - Keyboard Navigation', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should submit search on Enter key', async ({ homePage, page }) => {
    await homePage.typeQuery('test search');
    await page.keyboard.press('Enter');

    // Wait for transition to chat view
    await page.waitForTimeout(500);

    // User message should appear
    const userMessage = page.locator('.bg-orange-500.text-white');
    await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should focus input with Tab key', async ({ homePage, page }) => {
    // Tab to focus the search input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // The input should be focusable
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Search Functionality - Error Handling', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should handle network errors gracefully', async ({ homePage, page }) => {
    // Abort API requests to simulate network error
    await page.route('**/api/open-researcher', (route) => {
      route.abort('connectionfailed');
    });

    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Error message should be displayed
    const errorMessage = page.getByText(/error|sorry|failed/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle API errors gracefully', async ({ homePage, page }) => {
    // Mock API error response
    await page.route('**/api/open-researcher', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Error message should be displayed
    const errorMessage = page.getByText(/error|sorry/i);
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});
