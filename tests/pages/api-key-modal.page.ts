import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the API Key Modal dialog.
 * Encapsulates all interactions with the Firecrawl API key modal.
 */
export class ApiKeyModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly dialogDescription: Locator;
  readonly apiKeyInput: Locator;
  readonly submitButton: Locator;
  readonly getApiKeyButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.dialogTitle = page.getByRole('heading', { name: /firecrawl api key required/i });
    this.dialogDescription = page.getByText(/this tool requires a firecrawl api key/i);
    this.apiKeyInput = page.getByLabel(/firecrawl api key/i);
    this.submitButton = page.getByRole('button', { name: /submit/i });
    this.getApiKeyButton = page.getByRole('button', { name: /get firecrawl api key/i });
    this.closeButton = page.getByRole('button', { name: /close/i });
  }

  async waitForVisible() {
    await this.dialog.waitFor({ state: 'visible' });
  }

  async waitForHidden() {
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async isVisible() {
    return await this.dialog.isVisible();
  }

  async enterApiKey(key: string) {
    await this.apiKeyInput.fill(key);
  }

  async submit() {
    await this.submitButton.click();
  }

  async closeModal() {
    // Press escape to close the modal
    await this.page.keyboard.press('Escape');
  }
}
