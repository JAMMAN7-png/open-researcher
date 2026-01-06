import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object for the Open Researcher home page.
 * Encapsulates all interactions with the landing page.
 */
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

  constructor(page: Page) {
    this.page = page;
    this.logo = page.getByRole('link', { name: /firecrawl/i }).first();
    this.heading = page.getByRole('heading', { name: /open researcher/i });
    this.subtitle = page.getByText(/firecrawl-powered search/i);
    this.searchInput = page.getByPlaceholder(/enter query/i);
    this.submitButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    this.suggestedQueries = page.getByRole('button').filter({ hasText: /latest ai|blog post|compare/i });
    this.githubLink = page.getByRole('link', { name: /use this template/i });
    this.firecrawlFooterLink = page.getByRole('link', { name: 'Firecrawl' }).last();
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await this.heading.waitFor({ state: 'visible' });
  }

  async typeQuery(query: string) {
    await this.searchInput.fill(query);
  }

  async submitSearch() {
    await this.submitButton.click();
  }

  async clickSuggestion(index: number) {
    const suggestions = await this.suggestedQueries.all();
    if (suggestions[index]) {
      await suggestions[index].click();
    }
  }

  async focusSearchInput() {
    await this.searchInput.focus();
  }
}
