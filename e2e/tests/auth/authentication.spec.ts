import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

test.describe('Authentication', () => {
  // Auth tests own the auth flow — start every test unauthenticated.
  test.use({ storageState: { cookies: [], origins: [] } });

  // -------------------------------------------------------------------------
  // Registration - Happy Path
  // -------------------------------------------------------------------------

  test.describe('Registration - Happy Path', () => {
    test('registers successfully and redirects to library', async ({ registerPage, page }) => {
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
    test('redirects to library after successful login', async ({ loginPage, apiHelper, page }) => {
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
  });
});
