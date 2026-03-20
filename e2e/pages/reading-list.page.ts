import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { BookCardComponent } from '../components';

/**
 * The Reading List page at /reading-list.
 *
 * Displays only books with status "want-to-read". This is a derived view of the
 * shared books store — no separate API fetch. Shares the same BookCard layout and
 * actions as the Library page.
 */
export class ReadingListPage extends BasePage {
  protected readonly path = '/reading-list';

  readonly heading: Locator;
  /** Paragraph showing "N book(s)" — only visible when reading list is non-empty. */
  readonly bookCount: Locator;
  /** Empty state message shown when no books have "want-to-read" status. */
  readonly emptyStateMessage: Locator;
  /** CTA button in the empty state — navigates to /library. */
  readonly goToLibraryButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Reading List', level: 2 });
    this.bookCount = page.getByRole('main').locator('p').filter({ hasText: /^\d+ books?$/ });
    this.emptyStateMessage = page.getByText(
      "No books on your reading list yet. Mark books as 'Want to Read' from your library.",
    );
    this.goToLibraryButton = page.getByRole('button', { name: 'Go to Library' });
  }

  /**
   * Scope a BookCardComponent to the card with the given book title.
   */
  getBookCard(title: string): BookCardComponent {
    const root = this.page
      .getByTestId('book-card')
      .filter({ has: this.page.getByRole('heading', { name: title, level: 3 }) });
    return new BookCardComponent(this.page, root);
  }
}
