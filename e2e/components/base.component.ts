import { type Page, type Locator } from '@playwright/test';

/**
 * Base class for all shared UI component objects.
 *
 * Accepts either a CSS selector string or a pre-built Locator as the root.
 * All child locators should be scoped via `this.root` (or `this.root.getByRole()` etc.)
 * to prevent accidental matches outside the component boundary.
 */
export abstract class BaseComponent {
  readonly page: Page;
  protected readonly root: Locator;

  constructor(page: Page, root: string | Locator) {
    this.page = page;
    this.root = typeof root === 'string' ? page.locator(root) : root;
  }

  /**
   * Scope a CSS selector to this component's root element.
   * Use this for CSS selectors. For ARIA queries prefer `this.root.getByRole()` directly.
   */
  protected getChild(selector: string, options?: { hasText?: string | RegExp }): Locator {
    return this.root.locator(selector, options);
  }
}
