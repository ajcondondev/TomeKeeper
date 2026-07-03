import { type Page } from '@playwright/test';
import { SidebarComponent } from '../components';

/**
 * Abstract base for all page objects.
 *
 * Authenticated pages compose `this.sidebar`.
 * Public pages (LoginPage, RegisterPage) inherit this class but do not use the sidebar.
 */
export abstract class BasePage {
  readonly page: Page;
  readonly sidebar: SidebarComponent;

  protected abstract readonly path: string;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = new SidebarComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // 'load' rather than the discouraged 'networkidle' — data rendered after
    // API fetches is covered by locator auto-waiting in the specs.
    await this.page.waitForLoadState('load');
  }
}
