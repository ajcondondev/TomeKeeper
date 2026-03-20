import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { AddBookModalComponent, BookCardComponent } from '../components';
import type { BookFormData } from '../components';

/**
 * The My Library page at /library.
 *
 * Displays all of the user's books in a grid. Each card exposes status-toggle
 * and delete actions. Books are added via the AddBookModal.
 */
export class LibraryPage extends BasePage {
  protected readonly path = '/library';

  readonly heading: Locator;
  /** Paragraph showing "N book(s)" — only visible when library is non-empty. */
  readonly bookCount: Locator;
  /** The "Add Book" button in the page header. */
  readonly addBookButton: Locator;
  /** Empty state message shown when the library has no books. */
  readonly emptyStateMessage: Locator;
  /** The "Add Book" button inside the empty state — same action as addBookButton. */
  readonly emptyStateButton: Locator;

  readonly addBookModal: AddBookModalComponent;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'My Library', level: 2 });
    this.bookCount = page.getByRole('main').locator('p').filter({ hasText: /^\d+ books?$/ });
    this.addBookButton = page.getByRole('button', { name: 'Add Book' }).first();
    this.emptyStateMessage = page.getByText(
      'Your library is empty. Add your first book to get started.',
    );
    this.emptyStateButton = page.getByRole('button', { name: 'Add Book' }).last();
    this.addBookModal = new AddBookModalComponent(page);
  }

  /**
   * Scope a BookCardComponent to the card with the given book title.
   * Uses `data-testid="book-card"` combined with a heading filter for precision.
   */
  getBookCard(title: string): BookCardComponent {
    const root = this.page
      .getByTestId('book-card')
      .filter({ has: this.page.getByRole('heading', { name: title, level: 3 }) });
    return new BookCardComponent(this.page, root);
  }

  /**
   * Open the AddBookModal, fill the form, and submit.
   * The modal is expected to close on success; the caller should assert the outcome.
   */
  async addBook(data: BookFormData): Promise<void> {
    await this.addBookButton.click();
    await this.addBookModal.fillAndSubmit(data);
  }
}
