import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * The public Login page at /login.
 *
 * Email and password validation is performed by the browser (type="email" + required)
 * and server-side. Client errors surface as an inline alert paragraph.
 */
export class LoginPage extends BasePage {
  protected readonly path = '/login';

  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  /** Red banner shown on server-side auth failures (e.g. invalid credentials). */
  readonly errorAlert: Locator;
  readonly createAccountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByRole('textbox', { name: 'Email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.submitButton = page.getByRole('button', { name: 'Sign in' });
    this.errorAlert = page.locator('p').filter({
      hasText: /Invalid email or password|Login failed/,
    });
    this.createAccountLink = page.getByRole('link', { name: 'Create one' });
  }

  /**
   * Fill credentials and submit the login form.
   * Waits for redirect to /library on success.
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL('**/library');
  }

  /**
   * Fill and submit without waiting for redirect.
   * Use when testing invalid credential scenarios where no redirect occurs.
   */
  async submitCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
