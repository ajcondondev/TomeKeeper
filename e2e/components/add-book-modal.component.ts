import { type Page, type Locator } from '@playwright/test';
import { BaseComponent } from './base.component';

export interface BookFormData {
  title: string;
  author: string;
  genre?: string;
  pageCount?: number;
  coverUrl?: string;
}

/**
 * The "Add a Book" modal dialog.
 * Root: the dialog element identified by its aria-labelledby heading.
 *
 * Note: The modal is rendered in a portal — it only exists in the DOM when open.
 * Playwright locators are lazy, so it is safe to reference this component
 * before the modal is open; interactions will wait for it to appear.
 */
export class AddBookModalComponent extends BaseComponent {
  readonly titleInput: Locator;
  readonly authorInput: Locator;
  readonly genreInput: Locator;
  readonly pagesInput: Locator;
  readonly coverUrlInput: Locator;
  readonly findCoverButton: Locator;
  readonly closeButton: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;
  readonly coverFetchError: Locator;

  constructor(page: Page) {
    super(page, page.getByRole('dialog', { name: 'Add a Book' }));
    this.titleInput = this.root.getByRole('textbox', { name: 'Title *' });
    this.authorInput = this.root.getByRole('textbox', { name: 'Author *' });
    this.genreInput = this.root.getByRole('textbox', { name: 'Genre' });
    this.pagesInput = this.root.getByRole('spinbutton', { name: 'Pages' });
    this.coverUrlInput = this.root.getByRole('textbox', { name: 'Cover URL' });
    this.findCoverButton = this.root.getByRole('button', { name: 'Find Cover' });
    this.closeButton = this.root.getByRole('button', { name: 'Close' });
    this.cancelButton = this.root.getByRole('button', { name: 'Cancel' });
    this.submitButton = this.root.getByRole('button', { name: 'Add Book' });
    this.coverFetchError = this.root.locator('p').filter({
      hasText: /No cover found|Could not reach/,
    });
  }

  /** Get the inline validation error for a named field. */
  fieldError(field: 'title' | 'author'): Locator {
    const messages = { title: 'Title is required', author: 'Author is required' };
    return this.root.locator('p').filter({ hasText: messages[field] });
  }

  /**
   * Fill the form and submit. Waits for the modal to be present before interacting.
   * Does NOT wait for the modal to close — the caller controls post-submit assertions.
   */
  async fillAndSubmit(data: BookFormData): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.authorInput.fill(data.author);
    if (data.genre !== undefined) await this.genreInput.fill(data.genre);
    if (data.pageCount !== undefined) await this.pagesInput.fill(String(data.pageCount));
    if (data.coverUrl !== undefined) await this.coverUrlInput.fill(data.coverUrl);
    await this.submitButton.click();
  }
}
