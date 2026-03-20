import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

export interface EditReviewFormData {
  title?: string;
  review?: string;
}

/**
 * The "Edit Review" modal dialog.
 * Root: the dialog element identified by its accessible name.
 *
 * The Book field is read-only in this modal — only title and review are editable.
 */
export class EditReviewModalComponent extends BaseComponent {
  /** Read-only display of the book title + author. */
  readonly bookDisplay: Locator;

  readonly titleInput: Locator;
  readonly reviewTextarea: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, page.getByRole('dialog', { name: 'Edit Review' }));
    this.bookDisplay = this.root.locator('p').filter({
      hasText: /^.+ — .+$|^.+$/,
    });
    this.titleInput = this.root.getByRole('textbox', { name: 'Review Title *' });
    this.reviewTextarea = this.root.getByRole('textbox', { name: 'Review *' });
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
    this.submitButton = this.root.getByRole('button', { name: 'Save Changes' });
  }

  /** Get the inline validation error for a named field. */
  fieldError(field: 'title' | 'review'): Locator {
    const messages = { title: 'Title is required', review: 'Review is required' };
    return this.root.locator('p').filter({ hasText: messages[field] });
  }

  /**
   * Clear one or both fields, fill with new values, and submit.
   * Skips a field entirely if not provided in data.
   */
  async fillAndSubmit(data: EditReviewFormData): Promise<void> {
    if (data.title !== undefined) {
      await this.titleInput.clear();
      await this.titleInput.fill(data.title);
    }
    if (data.review !== undefined) {
      await this.reviewTextarea.clear();
      await this.reviewTextarea.fill(data.review);
    }
    await this.submitButton.click();
  }
}
