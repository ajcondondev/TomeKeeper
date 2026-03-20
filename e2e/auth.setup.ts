import path from 'path';
import { fileURLToPath } from 'url';
import { test as setup } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Auth setup — runs once before the browser test projects.
 *
 * Strategy:
 * 1. Attempt to register the shared E2E test user (idempotent — 409 is fine).
 * 2. Log in through the browser so the session cookie is captured in the page context.
 * 3. Save storageState (cookies) so all browser test projects start authenticated.
 *
 * The test user email/password come from env vars (see .env.example).
 * Defaults are safe for local dev; override on CI.
 */

export const authFile = path.join(__dirname, '.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.TEST_EMAIL ?? 'e2e-shared@tomekeeper.dev';
  const password = process.env.TEST_PASSWORD ?? 'SecurePass123!';
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

  // Register the shared test user — safe to call on every run (409 = already exists).
  await page.request.post(`${apiUrl}/api/auth/register`, {
    data: { email, password },
  });

  // Log in through the browser to capture the express-session cookie.
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/library');

  // Persist cookies (including the session cookie for localhost:3001).
  await page.context().storageState({ path: authFile });
});
