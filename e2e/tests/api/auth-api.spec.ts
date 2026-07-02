import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

// All tests in this file start unauthenticated — auth state is managed per-test.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Auth API Contract', { tag: '@regression' }, () => {

  // ---------------------------------------------------------------------------
  // POST /api/auth/register
  // ---------------------------------------------------------------------------

  test.describe('POST /api/auth/register', () => {
    test('returns 201 with created user for a new registration', { tag: '@smoke' }, async ({ apiHelper }) => {
      const user = TestDataFactory.user();

      const response = await apiHelper.registerRaw(user.email, user.password);

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.data.email).toBe(user.email);
    });

    test('returns 409 for a duplicate email', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      const response = await apiHelper.registerRaw(user.email, user.password);

      expect(response.status()).toBe(409);
    });

    test('returns 400 when email is missing', async ({ apiHelper }) => {
      const response = await apiHelper.registerRaw('', 'ValidPass123!');

      expect(response.status()).toBe(400);
    });

    test('returns 400 when password is missing', async ({ apiHelper }) => {
      const response = await apiHelper.registerRaw(TestDataFactory.email(), '');

      expect(response.status()).toBe(400);
    });

    test('returns 400 for a password shorter than 8 characters', async ({ apiHelper }) => {
      const response = await apiHelper.registerRaw(TestDataFactory.email(), 'Short1!');

      expect(response.status()).toBe(400);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/auth/login
  // ---------------------------------------------------------------------------

  test.describe('POST /api/auth/login', () => {
    test('returns 200 and sets a session cookie for valid credentials', { tag: '@smoke' }, async ({ playwright }) => {
      const apiUrl = process.env.API_URL ?? 'http://localhost:3001';
      const user = TestDataFactory.user();

      // Register in a separate context so the login context starts without a session cookie.
      // (The register endpoint also sets req.session.userId, which would cause the shared
      // context to already hold connect.sid — preventing a new Set-Cookie on login.)
      const setupCtx = await playwright.request.newContext();
      await setupCtx.post(`${apiUrl}/api/auth/register`, { data: user });
      await setupCtx.dispose();

      const loginCtx = await playwright.request.newContext();
      const response = await loginCtx.post(`${apiUrl}/api/auth/login`, { data: user });

      expect(response.status()).toBe(200);
      const setCookie = response.headers()['set-cookie'];
      expect(setCookie).toBeTruthy();

      await loginCtx.dispose();
    });

    test('returns 401 for a wrong password', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      const response = await apiHelper.loginRaw(user.email, 'wrongpassword123');

      expect(response.status()).toBe(401);
    });

    test('returns 401 for an unregistered email', async ({ apiHelper }) => {
      const response = await apiHelper.loginRaw(TestDataFactory.email('unknown'), 'ValidPass123!');

      expect(response.status()).toBe(401);
    });

    test('returns identical error body for wrong password and unknown email @security', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      const wrongPwResp = await apiHelper.loginRaw(user.email, 'wrongpassword123');
      const unknownEmailResp = await apiHelper.loginRaw(TestDataFactory.email('unknown'), 'ValidPass123!');

      const wrongPwBody = await wrongPwResp.json();
      const unknownEmailBody = await unknownEmailResp.json();

      expect(wrongPwBody.message).toBe(unknownEmailBody.message);
    });
  });

  // ---------------------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------------------

  test.describe('Rate limiting', () => {
    test('returns 429 after repeated failed logins for the same account @security', async ({ apiHelper }) => {
      const limit = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20);
      const email = TestDataFactory.email('bruteforce');

      // Exhaust the failed-attempt budget for this account.
      for (let i = 0; i < limit; i++) {
        await apiHelper.loginRaw(email, 'wrong-password-123');
      }

      const throttled = await apiHelper.loginRaw(email, 'wrong-password-123');

      expect(throttled.status()).toBe(429);
      const body = await throttled.json();
      expect(body.success).toBe(false);
    });

    test('throttling one account does not block other accounts @security', async ({ apiHelper }) => {
      const limit = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20);
      const attacked = TestDataFactory.email('attacked');
      const bystander = TestDataFactory.user();
      await apiHelper.registerRaw(bystander.email, bystander.password);

      for (let i = 0; i <= limit; i++) {
        await apiHelper.loginRaw(attacked, 'wrong-password-123');
      }

      const bystanderLogin = await apiHelper.loginRaw(bystander.email, bystander.password);

      expect(bystanderLogin.status()).toBe(200);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/auth/logout
  // ---------------------------------------------------------------------------

  test.describe('POST /api/auth/logout', () => {
    test('returns 200 for an authenticated session', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);
      await apiHelper.loginRaw(user.email, user.password);

      const response = await apiHelper.logoutRaw();

      expect(response.status()).toBe(200);
    });

    test('returns 401 for an unauthenticated request', async ({ apiHelper }) => {
      const response = await apiHelper.logoutRaw();

      expect(response.status()).toBe(401);
    });

    test('session cookie is invalidated — protected endpoints return 401 after logout @security', async ({
      apiHelper,
    }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);
      await apiHelper.loginRaw(user.email, user.password);

      // Confirm the session is active.
      const meBefore = await apiHelper.meRaw();
      expect(meBefore.status()).toBe(200);

      // Log out — the server should invalidate the session.
      await apiHelper.logoutRaw();

      // The same request context (same cookie jar) should now be rejected.
      const meAfter = await apiHelper.meRaw();
      expect(meAfter.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/auth/me
  // ---------------------------------------------------------------------------

  test.describe('GET /api/auth/me', () => {
    test('returns 200 with current user for an authenticated session', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);
      await apiHelper.loginRaw(user.email, user.password);

      const response = await apiHelper.meRaw();

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.email).toBe(user.email);
    });

    test('returns 401 for an unauthenticated request', async ({ apiHelper }) => {
      const response = await apiHelper.meRaw();

      expect(response.status()).toBe(401);
    });
  });
});
