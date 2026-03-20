import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * The public Registration page at /register.
 *
 * Client-side validation:
 *  - Email: browser native (type="email" + required)
 *  - Password: JS check — must be ≥8 chars before API call
 *
 * Server-side errors (e.g. duplicate email) surface as an inline alert paragraph.
 */
export class RegisterPage extends BasePage {
  protected readonly path = '/register';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  /**
   * Inline error paragraph — shown for:
   * - Password < 8 chars (client): "Password must be at least 8 characters"
   * - Duplicate email (server 409): "An account with that email already exists"
   */
  readonly errorAlert: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.submitButton = page.getByRole('button', { name: 'Create account' });
    this.errorAlert = page.locator('p').filter({
      hasText: /Password must be|already exists|Registration failed/,
    });
    this.signInLink = page.getByRole('link', { name: 'Sign in' });
  }

  /**
   * Fill and submit the registration form, then wait for redirect to /library on success.
   */
  async register(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('**/library');
  }

  /**
   * Fill and submit without waiting for redirect.
   * Use when testing validation failures.
   */
  async submitCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
