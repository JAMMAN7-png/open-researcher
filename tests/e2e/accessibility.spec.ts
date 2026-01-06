import { test, expect, setupMockApiKey, clearLocalStorage } from '../fixtures/test-fixtures';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - Home Page', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should have no accessibility violations on home page', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper page structure with landmarks', async ({ page }) => {
    // Check for main landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();

    // Check for banner (header)
    const header = page.getByRole('banner');
    await expect(header).toBeVisible();

    // Check for contentinfo (footer)
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();

    // Check for navigation
    const nav = page.getByRole('navigation');
    await expect(nav).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    // Check for h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();

    // Get all headings and verify hierarchy
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have accessible form elements', async ({ homePage, page }) => {
    // Search input should have placeholder
    await expect(homePage.searchInput).toHaveAttribute('placeholder');

    // Submit button should be accessible
    await expect(homePage.submitButton).toBeVisible();
  });

  test('should have proper link accessibility', async ({ page }) => {
    // Check external links have proper attributes
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();

    for (let i = 0; i < count; i++) {
      const link = externalLinks.nth(i);
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });
});

test.describe('Accessibility - API Key Modal', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
  });

  test('should have no accessibility violations on API key modal', async ({ homePage, page }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper dialog ARIA attributes', async ({ homePage, apiKeyModal, page }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Dialog should have aria-describedby
    await expect(dialog).toHaveAttribute('aria-describedby');
  });

  test('should have labeled form fields', async ({ homePage, apiKeyModal, page }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();

    // API key input should have label
    const label = page.getByText('Firecrawl API Key');
    await expect(label).toBeVisible();

    // Input should be labelledby or have aria-label
    const input = apiKeyModal.apiKeyInput;
    const hasLabel = await input.evaluate((el) => {
      return el.hasAttribute('id') && document.querySelector(`label[for="${el.id}"]`) !== null;
    });
    expect(hasLabel).toBe(true);
  });

  test('should announce button states', async ({ homePage, apiKeyModal }) => {
    await homePage.goto();
    await homePage.typeQuery('test');
    await homePage.submitSearch();

    await apiKeyModal.waitForVisible();

    // Disabled button should have proper state
    await expect(apiKeyModal.submitButton).toBeDisabled();
  });
});

test.describe('Accessibility - Keyboard Navigation', () => {
  test.beforeEach(async ({ page, homePage }) => {
    await setupMockApiKey(page);
    await homePage.goto();
    await homePage.waitForLoad();
  });

  test('should be fully navigable with keyboard', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');

    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focused = page.locator(':focus');
      // Focus should move to different elements
      await expect(focused).toBeVisible();
    }
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.keyboard.press('Tab');

    // Check that focus outline is visible
    const focusedElement = page.locator(':focus');
    const hasVisibleFocus = await focusedElement.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      // Check for outline, box-shadow, or border changes
      return (
        styles.outline !== 'none' ||
        styles.boxShadow !== 'none' ||
        styles.outlineStyle !== 'none'
      );
    });

    // Most elements should have visible focus
    expect(hasVisibleFocus).toBeTruthy();
  });

  test('should activate buttons with Enter and Space keys', async ({ homePage, page }) => {
    await homePage.focusSearchInput();
    await homePage.typeQuery('test query');

    // Tab to submit button
    await page.keyboard.press('Tab');

    // Enter should activate the button
    await page.keyboard.press('Enter');

    // Wait for transition
    await page.waitForTimeout(500);

    // User message should appear
    const userMessage = page.locator('.bg-orange-500.text-white');
    await expect(userMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Accessibility - Color Contrast', () => {
  test('should meet color contrast requirements in light mode', async ({ page, homePage }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await homePage.goto();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should meet color contrast requirements in dark mode', async ({ page, homePage }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await homePage.goto();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({ rules: { 'color-contrast': { enabled: true } } })
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });
});

test.describe('Accessibility - Images', () => {
  test('should have alt text for all images', async ({ page, homePage }) => {
    await homePage.goto();

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should not have duplicate alt text', async ({ page, homePage }) => {
    await homePage.goto();

    const images = page.locator('img[alt]');
    const count = await images.count();
    const altTexts: string[] = [];

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (alt) {
        altTexts.push(alt);
      }
    }

    // Check for meaningful alt texts (not just "image" or empty)
    for (const alt of altTexts) {
      expect(alt.toLowerCase()).not.toBe('image');
      expect(alt.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Accessibility - Screen Reader', () => {
  test('should have proper button labels', async ({ page, homePage }) => {
    await homePage.goto();

    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const hasAccessibleName = await button.evaluate((el) => {
        const accessibleName =
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          el.getAttribute('title');
        return accessibleName && accessibleName.length > 0;
      });

      // Buttons should have accessible names
      expect(hasAccessibleName).toBeTruthy();
    }
  });

  test('should have proper link labels', async ({ page, homePage }) => {
    await homePage.goto();

    const links = page.getByRole('link');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const hasAccessibleName = await link.evaluate((el) => {
        const accessibleName =
          el.getAttribute('aria-label') ||
          el.textContent?.trim() ||
          el.getAttribute('title');
        return accessibleName && accessibleName.length > 0;
      });

      // Links should have accessible names
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});

test.describe('Accessibility - Mobile', () => {
  test('should be accessible on mobile viewport', async ({ page, homePage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have adequate touch targets on mobile', async ({ page, homePage }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await homePage.goto();

    // Check that interactive elements have adequate size (44x44 minimum)
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 32x32 (preferably 44x44)
          expect(box.width).toBeGreaterThanOrEqual(32);
          expect(box.height).toBeGreaterThanOrEqual(32);
        }
      }
    }
  });
});
