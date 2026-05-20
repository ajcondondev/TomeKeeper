import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

// Namespaced demo account created by `npm run db:seed` (server/db/seed.ts).
const SUPPORT_USER = { email: 'scenario+support@tomekeeper.dev', password: 'SecurePass123!' };
const RESOLVED_TICKET_ID = 'seed-ticket-resolved';

test.describe('Support API Contract', { tag: '@regression' }, () => {
  test.describe('GET /api/support/tickets', () => {
    test('returns 200 with an empty array for a user with no tickets', { tag: '@smoke' }, async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const response = await ctx.get(`${apiUrl}/api/support/tickets`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toEqual([]);

      await ctx.dispose();
    });

    test('returns 401 for an unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });

      const response = await ctx.get(`${apiUrl}/api/support/tickets`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });

    test('returns the seeded tickets for the demo account', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: SUPPORT_USER });
      const api = new ApiHelper(ctx);

      const tickets = await api.getSupportTickets();
      await ctx.dispose();

      expect(tickets.length).toBeGreaterThanOrEqual(9);
      expect(tickets.every(t => typeof t.ticketNumber === 'number')).toBe(true);
      expect(tickets.some(t => t.status === 'closed')).toBe(true);
    });

    test('supports filtering by status, priority, and category', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: SUPPORT_USER });
      const api = new ApiHelper(ctx);

      const open = await api.getSupportTickets({ status: 'open' });
      const high = await api.getSupportTickets({ priority: 'high' });
      const imports = await api.getSupportTickets({ category: 'import' });
      await ctx.dispose();

      expect(open.length).toBeGreaterThanOrEqual(1);
      expect(open.every(t => t.status === 'open')).toBe(true);
      expect(high.every(t => t.priority === 'high')).toBe(true);
      expect(imports.every(t => t.category === 'import')).toBe(true);
    });
  });

  test.describe('GET /api/support/tickets/:id/events', () => {
    test('returns the activity timeline for the demo account\'s ticket', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: SUPPORT_USER });
      const api = new ApiHelper(ctx);

      const events = await api.getTicketEvents(RESOLVED_TICKET_ID);
      await ctx.dispose();

      expect(events.length).toBeGreaterThanOrEqual(4);
      expect(events.some(e => e.eventType === 'created')).toBe(true);
      expect(events.some(e => e.eventType === 'resolution')).toBe(true);
    });
  });

  test.describe('Tenant isolation', () => {
    test('one user cannot retrieve another user\'s ticket', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const detail = await ctx.get(`${apiUrl}/api/support/tickets/${RESOLVED_TICKET_ID}`);
      const events = await ctx.get(`${apiUrl}/api/support/tickets/${RESOLVED_TICKET_ID}/events`);
      await ctx.dispose();

      expect([403, 404]).toContain(detail.status());
      expect([403, 404]).toContain(events.status());
    });
  });
});
