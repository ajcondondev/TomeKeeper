import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

// All tests in this file start unauthenticated — auth state is managed per-test.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Auth API Contract', () => {

  // ---------------------------------------------------------------------------
  // POST /api/auth/register
  // ---------------------------------------------------------------------------

  test.describe('POST /api/auth/register', () => {
    test('returns 201 with created user for a new registration @smoke', async ({ apiHelper }) => {
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
    test('returns 200 and sets a session cookie for valid credentials @smoke', async ({ apiHelper }) => {
      const user = TestDataFactory.user();
      await apiHelper.registerRaw(user.email, user.password);

      const response = await apiHelper.loginRaw(user.email, user.password);

      expect(response.status()).toBe(200);
      const setCookie = response.headers()['set-cookie'];
      expect(setCookie).toBeTruthy();
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
