import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

test.describe('Authentication', { tag: '@regression' }, () => {
  // Auth tests own the auth flow — start every test unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  // -------------------------------------------------------------------------
  // Registration - Happy Path
  // -------------------------------------------------------------------------

  test.describe('Registration - Happy Path', () => {
    test('registers successfully and redirects to library', { tag: '@smoke' }, async ({ registerPage, page }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.register(user.email, user.password);

      await expect(page).toHaveURL(/\/library/);
    });

    test('automatically logs in and shows user email in sidebar after registration', async ({
      registerPage,
      libraryPage,
    }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.register(user.email, user.password);

      await expect(libraryPage.sidebar.userEmail).toHaveText(user.email);
    });

    test('authenticated user visiting /login is redirected to library', async ({
      registerPage,
      loginPage,
      page,
    }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.register(user.email, user.password);

      await loginPage.goto();

      await expect(page).toHaveURL(/\/library/);
    });
  });

  // -------------------------------------------------------------------------
  // Registration - Negative Cases
  // -------------------------------------------------------------------------

  test.describe('Registration - Negative Cases', () => {
    test('shows error when password is shorter than 8 characters', async ({ registerPage }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.submitCredentials(user.email, 'passwor'); // 7 chars

      await expect(registerPage.errorAlert).toContainText('Password must be at least 8');
    });

    test('shows error when registering with an already-registered email', async ({
      registerPage,
      apiHelper,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await registerPage.goto();
      await registerPage.submitCredentials(user.email, user.password);

      await expect(registerPage.errorAlert).toContainText('already exists');
    });
  });

  // -------------------------------------------------------------------------
  // Registration - Edge Cases (Boundary Values)
  // -------------------------------------------------------------------------

  test.describe('Registration - Edge Cases', () => {
    test('accepts exactly 8-character password (minimum valid boundary)', async ({
      registerPage,
      page,
    }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.register(user.email, 'Pass123!'); // exactly 8 chars

      await expect(page).toHaveURL(/\/library/);
    });

    test('rejects exactly 7-character password (one below minimum boundary)', async ({
      registerPage,
    }) => {
      const user = TestDataFactory.user();

      await registerPage.goto();
      await registerPage.submitCredentials(user.email, 'Pass12!'); // 7 chars

      await expect(registerPage.errorAlert).toContainText('Password must be at least 8');
    });
  });

  // -------------------------------------------------------------------------
  // Login - Happy Path
  // -------------------------------------------------------------------------

  test.describe('Login - Happy Path', () => {
    test('redirects to library after successful login', { tag: '@smoke' }, async ({ loginPage, apiHelper, page }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.login(user.email, user.password);

      await expect(page).toHaveURL(/\/library/);
    });

    test('shows user email in sidebar after login', async ({ loginPage, libraryPage, apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.login(user.email, user.password);

      await expect(libraryPage.sidebar.userEmail).toHaveText(user.email);
    });
  });

  // -------------------------------------------------------------------------
  // Login - Negative Cases
  // -------------------------------------------------------------------------

  test.describe('Login - Negative Cases', () => {
    test('shows error for unregistered email', async ({ loginPage }) => {
      const user = TestDataFactory.user();

      await loginPage.goto();
      await loginPage.submitCredentials(user.email, user.password);

      await expect(loginPage.errorAlert).toContainText('Invalid email or password');
    });

    test('shows error for wrong password', async ({ loginPage, apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.submitCredentials(user.email, 'wrongpassword123');

      await expect(loginPage.errorAlert).toContainText('Invalid email or password');
    });

    test('uses the same error message for wrong password and unregistered email (no user enumeration)', async ({
      loginPage,
      apiHelper,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      // Submit with wrong password
      await loginPage.goto();
      await loginPage.submitCredentials(user.email, 'wrongpassword123');
      await expect(loginPage.errorAlert).toBeVisible();
      const wrongPasswordError = await loginPage.errorAlert.textContent();

      // Submit with unregistered email
      await loginPage.goto();
      await loginPage.submitCredentials(TestDataFactory.email('unknown'), user.password);
      await expect(loginPage.errorAlert).toBeVisible();
      const unknownEmailError = await loginPage.errorAlert.textContent();

      expect(wrongPasswordError).toBe(unknownEmailError);
    });
  });

  // -------------------------------------------------------------------------
  // Logout
  // -------------------------------------------------------------------------

  test.describe('Logout', () => {
    test('redirects to login page after signing out', async ({
      loginPage,
      libraryPage,
      apiHelper,
      page,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.login(user.email, user.password);

      await libraryPage.sidebar.signOut();

      await expect(page).toHaveURL(/\/login/);
    });

    test('cannot access protected route after signing out', async ({
      loginPage,
      libraryPage,
      apiHelper,
      page,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.login(user.email, user.password);

      await libraryPage.sidebar.signOut();

      await page.goto('/library');

      await expect(page).toHaveURL(/\/login/);
    });

    test('browser back after signing out does not restore the session', async ({
      loginPage,
      libraryPage,
      apiHelper,
      page,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      await loginPage.goto();
      await loginPage.login(user.email, user.password);

      await libraryPage.sidebar.signOut();
      await expect(page).toHaveURL(/\/login/);

      await page.goBack();

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // -------------------------------------------------------------------------
  // Route Protection (unauthenticated direct URL access)
  // -------------------------------------------------------------------------

  test.describe('Route Protection', () => {
    test('unauthenticated visit to /library redirects to login', async ({ page }) => {
      await page.goto('/library');

      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /reading-list redirects to login', async ({ page }) => {
      await page.goto('/reading-list');

      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to /reviews redirects to login', async ({ page }) => {
      await page.goto('/reviews');

      await expect(page).toHaveURL(/\/login/);
    });

    test('unauthenticated visit to / redirects to login', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveURL(/\/login/);
    });
  });

  // -------------------------------------------------------------------------
  // Root redirect (authenticated)
  // -------------------------------------------------------------------------

  test.describe('Root Redirect', () => {
    // These tests need an authenticated session — override back to auth state.
    // The outer describe already uses storageState: { cookies: [], origins: [] },
    // so we import from the shared authFile that the setup project produces.
    test('authenticated visit to / redirects to library', async ({ page }) => {
      // page already carries the storageState from the outer test.use() which
      // clears cookies. We need the shared auth session for this test, so we
      // log in inline.
      const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
      const email = process.env.TEST_EMAIL ?? 'e2e-shared@tomekeeper.dev';
      const password = process.env.TEST_PASSWORD ?? 'SecurePass123!';

      // Ensure the shared user exists (idempotent).
      await page.request.post(`${apiUrl}/api/auth/register`, { data: { email, password } });

      await page.goto('/login');
      await page.getByRole('textbox', { name: 'Email' }).fill(email);
      await page.getByRole('textbox', { name: 'Password' }).fill(password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await page.waitForURL('**/library');

      await page.goto('/');

      await expect(page).toHaveURL(/\/library/);
    });
  });
});
