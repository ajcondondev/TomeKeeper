import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

// Namespaced demo account created by `npm run db:seed` (server/db/seed.ts).
const IMPORTS_USER = { email: 'scenario+imports@tomekeeper.dev', password: 'SecurePass123!' };
const COMPLETED_WITH_ERRORS_IMPORT_ID = 'seed-import-with-errors';

test.describe('Imports API Contract', { tag: '@regression' }, () => {
  test.describe('GET /api/imports', () => {
    test('returns 200 with an empty array for a user with no imports', { tag: '@smoke' }, async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const response = await ctx.get(`${apiUrl}/api/imports`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);

      await ctx.dispose();
    });

    test('returns 401 for an unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });

      const response = await ctx.get(`${apiUrl}/api/imports`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });

    test('returns the seeded import batches for the demo account', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: IMPORTS_USER });
      const api = new ApiHelper(ctx);

      const batches = await api.getImports();
      await ctx.dispose();

      expect(batches.length).toBeGreaterThanOrEqual(5);
      expect(batches.every(b => typeof b.totalRows === 'number')).toBe(true);
      expect(batches.some(b => b.status === 'completed_with_errors')).toBe(true);
    });

    test('supports filtering by status', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: IMPORTS_USER });
      const api = new ApiHelper(ctx);

      const failed = await api.getImports('failed');
      await ctx.dispose();

      expect(failed.length).toBeGreaterThanOrEqual(1);
      expect(failed.every(b => b.status === 'failed')).toBe(true);
    });
  });

  test.describe('GET /api/imports/:id/rows', () => {
    test('returns row-level diagnostics for the demo account\'s import', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: IMPORTS_USER });
      const api = new ApiHelper(ctx);

      const rows = await api.getImportRows(COMPLETED_WITH_ERRORS_IMPORT_ID);
      await ctx.dispose();

      expect(rows.length).toBeGreaterThanOrEqual(4);
      expect(rows.some(r => r.status === 'rejected' && r.errorMessage !== null && r.bookId === null)).toBe(true);
      expect(rows.some(r => r.status === 'accepted' && r.bookId !== null)).toBe(true);
    });
  });

  test.describe('Tenant isolation', () => {
    test('one user cannot retrieve another user\'s import', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const detail = await ctx.get(`${apiUrl}/api/imports/${COMPLETED_WITH_ERRORS_IMPORT_ID}`);
      const rows = await ctx.get(`${apiUrl}/api/imports/${COMPLETED_WITH_ERRORS_IMPORT_ID}/rows`);
      await ctx.dispose();

      expect([403, 404]).toContain(detail.status());
      expect([403, 404]).toContain(rows.status());
    });
  });
});
