import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * The persistent sidebar present on all authenticated pages.
 * Root: the `complementary` landmark (the <aside> element).
 *
 * Contains navigation links, the signed-in user's email, and the Sign Out button.
 */
export class SidebarComponent extends BaseComponent {
  readonly libraryLink: Locator;
  readonly readingListLink: Locator;
  readonly reviewsLink: Locator;
  readonly userEmail: Locator;
  readonly signOutButton: Locator;

  constructor(page: Page) {
    super(page, page.getByRole('complementary'));
    this.libraryLink = this.root.getByRole('link', { name: 'My Library' });
    this.readingListLink = this.root.getByRole('link', { name: 'Reading List' });
    this.reviewsLink = this.root.getByRole('link', { name: 'My Reviews' });
    this.userEmail = this.root.getByRole('paragraph');
    this.signOutButton = this.root.getByRole('button', { name: 'Sign out' });
  }

  /** Sign out and wait for redirect to /login. */
  async signOut(): Promise<void> {
    await this.signOutButton.click();
    await this.page.waitForURL('**/login');
  }
}
