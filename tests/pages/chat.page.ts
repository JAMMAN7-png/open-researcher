import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Chat interface.
 * Encapsulates all interactions with the chat/research interface.
 */
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

  constructor(page: Page) {
    this.page = page;
    this.chatContainer = page.locator('.flex.flex-col.bg-white, .flex.flex-col.bg-gray-900');
    this.messagesArea = page.locator('.overflow-y-auto.space-y-3, .overflow-y-auto.space-y-4');
    this.searchInput = page.getByPlaceholder(/enter query/i);
    this.submitButton = page.getByRole('button').filter({ has: page.locator('svg') });
    this.userMessages = page.locator('.bg-orange-500.text-white');
    this.assistantMessages = page.locator('.bg-gray-100, .bg-gray-800');
    this.loadingIndicator = page.getByText(/researching/i);
    this.errorMessage = page.getByText(/error|sorry/i);
    this.copyButton = page.getByRole('button', { name: /copy/i });
    this.browserPanel = page.locator('[class*="SearchResultsDisplay"]');
  }

  async typeQuery(query: string) {
    await this.searchInput.fill(query);
  }

  async submitQuery() {
    await this.submitButton.first().click();
  }

  async submitQueryWithText(query: string) {
    await this.typeQuery(query);
    await this.submitQuery();
  }

  async waitForResponse() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 60000 });
  }

  async getUserMessageCount() {
    return await this.userMessages.count();
  }

  async getAssistantMessageCount() {
    return await this.assistantMessages.count();
  }

  async isLoading() {
    return await this.loadingIndicator.isVisible();
  }

  async copyLastResponse() {
    await this.copyButton.last().click();
  }
}
