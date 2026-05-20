import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

// Namespaced demo account created by `npm run db:seed` (server/db/seed.ts).
const DEMO_USER = { email: 'scenario+reading@tomekeeper.dev', password: 'SecurePass123!' };

test.describe('Reading Sessions API Contract', { tag: '@regression' }, () => {
  test.describe('GET /api/reading/sessions', () => {
    test('returns 200 with an empty array for a user with no sessions', { tag: '@smoke' }, async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const response = await ctx.get(`${apiUrl}/api/reading/sessions`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);

      await ctx.dispose();
    });

    test('returns 401 for an unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });

      const response = await ctx.get(`${apiUrl}/api/reading/sessions`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });

    test('returns seeded sessions joined to their book, including an in-progress session', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: DEMO_USER });
      const api = new ApiHelper(ctx);

      const sessions = await api.getReadingSessions();
      await ctx.dispose();

      expect(sessions.length).toBeGreaterThanOrEqual(4);

      const session = sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('bookId');
      expect(session).toHaveProperty('bookTitle');

      expect(sessions.some(s => s.endedAt === null)).toBe(true);
    });
  });
});
