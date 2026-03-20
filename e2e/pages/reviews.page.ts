import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';
import {
  AddReviewModalComponent,
  EditReviewModalComponent,
  ReviewCardComponent,
} from '../components';
import type { ReviewFormData } from '../components';

/**
 * The My Reviews page at /reviews.
 *
 * Displays all of the user's text reviews. Reviews are created, edited, and
 * deleted directly on this page through modals.
 */
export class ReviewsPage extends BasePage {
  protected readonly path = '/reviews';

  readonly heading: Locator;
  /** Paragraph showing "N review(s)" — only visible when at least one review exists. */
  readonly reviewCount: Locator;
  /** The "Add Review" button in the page header. */
  readonly addReviewButton: Locator;
  /** Empty state message shown when no reviews exist. */
  readonly emptyStateMessage: Locator;
  /** CTA button inside the empty state. */
  readonly emptyStateButton: Locator;
  /** Loading indicator shown during initial data fetch. */
  readonly loadingIndicator: Locator;

  readonly addReviewModal: AddReviewModalComponent;
  readonly editReviewModal: EditReviewModalComponent;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'My Reviews', level: 2 });
    this.reviewCount = page.getByRole('main').locator('p').filter({ hasText: /^\d+ reviews?$/ });
    this.addReviewButton = page.getByRole('button', { name: 'Add Review' }).first();
    this.emptyStateMessage = page.getByText(
      'No reviews yet. Add your first review to get started.',
    );
    this.emptyStateButton = page.getByRole('button', { name: 'Add Review' }).last();
    this.loadingIndicator = page.getByRole('status', { name: 'Loading...' });
    this.addReviewModal = new AddReviewModalComponent(page);
    this.editReviewModal = new EditReviewModalComponent(page);
  }

  /**
   * Scope a ReviewCardComponent to the card with the given review title.
   */
  getReviewCard(title: string): ReviewCardComponent {
    const root = this.page
      .getByTestId('review-card')
      .filter({ has: this.page.getByRole('heading', { name: title, level: 3 }) });
    return new ReviewCardComponent(this.page, root);
  }

  /**
   * Open the AddReviewModal, fill the form, and submit.
   * The caller should assert the outcome after this method returns.
   */
  async addReview(data: ReviewFormData): Promise<void> {
    await this.addReviewButton.click();
    await this.addReviewModal.fillAndSubmit(data);
  }
}
