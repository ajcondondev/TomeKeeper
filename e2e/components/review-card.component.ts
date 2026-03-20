import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

/**
 * A single ReviewCard as it appears on the Reviews page.
 *
 * The root Locator must be pre-scoped to the specific card by the parent page
 * via `ReviewsPage.getReviewCard(title)`.
 */
export class ReviewCardComponent extends BaseComponent {
  /** The h3 heading with the review title. */
  readonly titleHeading: Locator;

  /** The book title + author line (e.g., "Dune · Frank Herbert"). */
  readonly bookLine: Locator;

  /** The creation date string (e.g., "Mar 20, 2026"). */
  readonly dateText: Locator;

  /** The review body paragraph. */
  readonly reviewText: Locator;

  /** Opens the Edit Review modal for this card. */
  readonly editButton: Locator;

  /** Permanently deletes this review. */
  readonly deleteButton: Locator;

  constructor(page: Page, root: Locator) {
    super(page, root);
    this.titleHeading = this.root.getByRole('heading', { level: 3 });
    this.bookLine = this.root.getByRole('paragraph').first();
    this.dateText = this.root.locator('p').filter({ hasText: /^\w{3} \d{1,2}, \d{4}$/ });
    this.reviewText = this.root.locator('p').last();
    this.editButton = this.root.getByRole('button', { name: 'Edit' });
    this.deleteButton = this.root.getByRole('button', { name: 'Delete' });
  }
}
