import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * A single BookCard as it appears in the Library or Reading List.
 *
 * The root Locator must be pre-scoped to the specific card element by the
 * parent page (via `LibraryPage.getBookCard(title)` or `ReadingListPage.getBookCard(title)`).
 *
 * The Read/Unread and Want to Read/Remove buttons are toggles — their labels
 * flip based on the book's current status. Expose both label variants via regex.
 */
export class BookCardComponent extends BaseComponent {
  /** The h3 heading with the book title. */
  readonly titleHeading: Locator;

  /** The author paragraph beneath the title. */
  readonly authorText: Locator;

  /**
   * The status badge (span) showing the current reading status:
   * "Unread" | "Read" | "Want to Read".
   */
  readonly statusBadge: Locator;

  /**
   * Toggle button for the read/unread state.
   * Label is "Read" when book is unread (click → marks read).
   * Label is "Unread" when book is read (click → marks unread).
   */
  readonly readToggleButton: Locator;

  /**
   * Toggle button for the reading list state.
   * Label is "Want to Read" when not on list (click → adds to list).
   * Label is "Remove" when on reading list (click → removes from list).
   */
  readonly wantToReadToggleButton: Locator;

  /** Permanently deletes the book. */
  readonly deleteButton: Locator;

  /**
   * The fallback placeholder icon shown when the cover URL is absent or fails to load.
   * Only present in the DOM when the img is not rendered.
   */
  readonly coverFallbackIcon: Locator;

  constructor(page: Page, root: Locator) {
    super(page, root);
    this.titleHeading = this.root.getByRole('heading', { level: 3 });
    this.authorText = this.root.getByRole('paragraph').first();
    // Status badge is a <span> styled as a rounded pill. The button spans inside
    // the card also match the text, so narrow by the badge's rounded-full class.
    this.statusBadge = this.root.locator('span.rounded-full').filter({
      hasText: /^(Unread|Read|Want to Read)$/,
    });
    this.readToggleButton = this.root.getByRole('button', { name: /^(Read|Unread)$/ });
    this.wantToReadToggleButton = this.root.getByRole('button', {
      name: /^(Want to Read|Remove)$/,
    });
    this.deleteButton = this.root.getByRole('button', { name: 'Delete book' });
    this.coverFallbackIcon = this.root.getByTestId('cover-fallback');
  }
}
