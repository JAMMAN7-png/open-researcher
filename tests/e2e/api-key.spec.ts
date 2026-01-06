import { test, expect, clearLocalStorage, MOCK_FIRECRAWL_KEY } from '../fixtures/test-fixtures';

test.describe('API Key Modal - Display', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should show modal when search is attempted without API key', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.waitForLoad();

    await homePage.typeQuery('test search');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.dialog).toBeVisible();
  });

  test('should display modal title', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.dialogTitle).toContainText('Firecrawl API Key Required');
  });

  test('should display modal description', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.dialogDescription).toContainText('requires a Firecrawl API key');
  });

  test('should have API key input field', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.apiKeyInput).toBeVisible();
    await expect(apiKeyModal.apiKeyInput).toHaveAttribute('type', 'password');
  });

  test('should have Get API Key button', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.getApiKeyButton).toBeVisible();
  });

  test('should have Submit button', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.submitButton).toBeVisible();
  });
});

test.describe('API Key Modal - Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should close modal on Escape key', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.closeModal();

    await expect(apiKeyModal.dialog).toBeHidden({ timeout: 5000 });
  });

  test('should have disabled Submit button when input is empty', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await expect(apiKeyModal.submitButton).toBeDisabled();
  });

  test('should enable Submit button when API key is entered', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey('fc-test-key');

    await expect(apiKeyModal.submitButton).toBeEnabled();
  });

  test('should show loading state on submit', async ({ homePage, apiKeyModal, page }) => {
    // Mock the scrape API to delay response
    await page.route('**/api/scrape', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true }),
      });
    });

    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey(MOCK_FIRECRAWL_KEY);
    await apiKeyModal.submit();

    // Check for loading indicator
    const loader = page.locator('.animate-spin');
    await expect(loader.first()).toBeVisible({ timeout: 2000 });
  });
});

test.describe('API Key Modal - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should show error for invalid API key', async ({ homePage, apiKeyModal, page }) => {
    // Mock API to return error
    await page.route('**/api/scrape', (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({ error: 'Invalid API key' }),
      });
    });

    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey('invalid-key');
    await apiKeyModal.submit();

    // Wait for error toast/message
    await page.waitForTimeout(1000);

    // Check for error indication (toast or inline error)
    const errorElement = page.getByText(/invalid|error|check and try again/i);
    await expect(errorElement.first()).toBeVisible({ timeout: 5000 });
  });

  test('should close modal and save valid API key', async ({ homePage, apiKeyModal, page }) => {
    // Mock successful API validation
    await page.route('**/api/scrape', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { markdown: 'test' } }),
      });
    });

    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey(MOCK_FIRECRAWL_KEY);
    await apiKeyModal.submit();

    // Modal should close after successful validation
    await expect(apiKeyModal.dialog).toBeHidden({ timeout: 10000 });
  });

  test('should persist API key in localStorage', async ({ homePage, apiKeyModal, page }) => {
    // Mock successful API validation
    await page.route('**/api/scrape', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { markdown: 'test' } }),
      });
    });

    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey(MOCK_FIRECRAWL_KEY);
    await apiKeyModal.submit();

    // Wait for modal to close
    await expect(apiKeyModal.dialog).toBeHidden({ timeout: 10000 });

    // Check localStorage
    const storedKey = await page.evaluate(() => localStorage.getItem('firecrawl_api_key'));
    expect(storedKey).toBe(MOCK_FIRECRAWL_KEY);
  });
});

test.describe('API Key Modal - Keyboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should trap focus within modal', async ({ homePage, apiKeyModal, page }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();

    // Tab through modal elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should still be within modal
    const focusedElement = page.locator(':focus');
    const isInModal = await focusedElement.evaluate((el) => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(el) ?? false;
    });

    expect(isInModal).toBe(true);
  });

  test('should submit on Enter key when input is focused', async ({ homePage, apiKeyModal, page }) => {
    // Mock successful API validation
    await page.route('**/api/scrape', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { markdown: 'test' } }),
      });
    });

    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();
    await apiKeyModal.enterApiKey(MOCK_FIRECRAWL_KEY);
    await page.keyboard.press('Enter');

    // Modal should close after successful validation
    await expect(apiKeyModal.dialog).toBeHidden({ timeout: 10000 });
  });
});

test.describe('API Key Modal - External Links', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should open Firecrawl website in new tab on Get API Key click', async ({ homePage, apiKeyModal, page, context }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();

    // Listen for new page
    const pagePromise = context.waitForEvent('page');
    await apiKeyModal.getApiKeyButton.click();

    const newPage = await pagePromise;
    await newPage.waitForLoadState();

    expect(newPage.url()).toContain('firecrawl.dev');
  });
});
