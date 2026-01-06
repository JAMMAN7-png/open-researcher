import { test as base } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { ApiKeyModalPage } from '../pages/api-key-modal.page';
import { ChatPage } from '../pages/chat.page';

/**
 * Custom test fixtures for Open Researcher E2E tests.
 * Provides page objects and common test setup.
 */
type Fixtures = {
  homePage: HomePage;
  apiKeyModal: ApiKeyModalPage;
  chatPage: ChatPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await use(homePage);
  },
  apiKeyModal: async ({ page }, use) => {
    const apiKeyModal = new ApiKeyModalPage(page);
    await use(apiKeyModal);
  },
  chatPage: async ({ page }, use) => {
    const chatPage = new ChatPage(page);
    await use(chatPage);
  },
});

export { expect } from '@playwright/test';

/**
 * Mock Firecrawl API key for testing.
 * This is used to bypass the API key modal in tests.
 */
export const MOCK_FIRECRAWL_KEY = 'fc-test-key-12345';

/**
 * Helper to set up localStorage with a mock API key.
 */
export async function setupMockApiKey(page: HomePage['page']) {
  await page.addInitScript((key) => {
    localStorage.setItem('firecrawl_api_key', key);
  }, MOCK_FIRECRAWL_KEY);
}

/**
 * Helper to clear localStorage.
 */
export async function clearLocalStorage(page: HomePage['page']) {
  await page.addInitScript(() => {
    localStorage.clear();
  });
}
