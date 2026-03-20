import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

export interface ReviewFormData {
  /** The option text as it appears in the dropdown: "Book Title — Author" */
  bookOption: string;
  title: string;
  review: string;
}

/**
 * The "Add a Review" modal dialog.
 * Root: the dialog element identified by its accessible name.
 */
export class AddReviewModalComponent extends BaseComponent {
  readonly bookSelect: Locator;
  readonly titleInput: Locator;
  readonly reviewTextarea: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, page.getByRole('dialog', { name: 'Add a Review' }));
    this.bookSelect = this.root.getByRole('combobox', { name: 'Book *' });
    this.titleInput = this.root.getByRole('textbox', { name: 'Review Title *' });
    this.reviewTextarea = this.root.getByRole('textbox', { name: 'Review *' });
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
    this.submitButton = this.root.getByRole('button', { name: 'Add Review' });
  }

  /** Get the inline validation error for a named field. */
  fieldError(field: 'book' | 'title' | 'review'): Locator {
    const messages = {
      book: 'Please select a book',
      title: 'Title is required',
      review: 'Review is required',
    };
    return this.root.locator('p').filter({ hasText: messages[field] });
  }

  /**
   * Select a book, fill the form, and submit.
   * Does NOT wait for modal close — the caller controls post-submit assertions.
   */
  async fillAndSubmit(data: ReviewFormData): Promise<void> {
    await this.bookSelect.selectOption(data.bookOption);
    await this.titleInput.fill(data.title);
    await this.reviewTextarea.fill(data.review);
    await this.submitButton.click();
  }
}
