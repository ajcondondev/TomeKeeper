import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ESM-compatible __dirname (root package.json has "type": "module")
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load e2e-specific env vars from e2e/.env (falls back to process.env)
dotenv.config({ path: path.join(__dirname, '.env') });

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';
const authFile = path.join(__dirname, '.auth', 'user.json');

/**
 * TomeKeeper E2E Test Configuration
 *
 * Projects:
 *  - setup         — registers + logs in the shared test user; saves storageState
 *  - chromium      — full E2E tests in Chrome (authenticated)
 *  - firefox       — full E2E tests in Firefox (authenticated)
 *  - webkit        — full E2E tests in Safari/WebKit (authenticated)
 *  - visual        — screenshot regression tests, Chromium only (*.visual.spec.ts)
 *  - accessibility — axe-core scans, Chromium only (*.a11y.spec.ts)
 *
 * Auth tests (login.spec.ts, register.spec.ts) clear storageState per-test
 * via `test.use({ storageState: { cookies: [], origins: [] } })`.
 */
export default defineConfig({
  testDir: './tests',

  /* Run test files in parallel; individual tests within a file run sequentially by default */
  fullyParallel: true,

  /* Fail CI builds if test.only is accidentally left in a committed file */
  forbidOnly: !!process.env.CI,

  /* Retry flaky tests on CI; no retries locally so failures are obvious */
  retries: process.env.CI ? 2 : 0,

  /* CI uses more workers for speed; local uses default (CPU count) */
  workers: process.env.CI ? 4 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // ------------------------------------------------------------------
    // Auth setup — runs once; produces .auth/user.json
    // ------------------------------------------------------------------
    {
      name: 'setup',
      testDir: './',
      testMatch: /auth\.setup\.ts/,
      use: { baseURL },
    },

    // ------------------------------------------------------------------
    // Functional E2E — all three browsers, authenticated
    // ------------------------------------------------------------------
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.a11y\.spec\.ts/],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.a11y\.spec\.ts/],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testIgnore: [/.*\.visual\.spec\.ts/, /.*\.a11y\.spec\.ts/],
    },

    // ------------------------------------------------------------------
    // Visual regression — Chromium only, *.visual.spec.ts
    // ------------------------------------------------------------------
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testMatch: /.*\.visual\.spec\.ts/,
    },

    // ------------------------------------------------------------------
    // Accessibility — Chromium only, *.a11y.spec.ts
    // ------------------------------------------------------------------
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
      dependencies: ['setup'],
      testMatch: /.*\.a11y\.spec\.ts/,
    },
  ],

  // ------------------------------------------------------------------
  // Start servers automatically when not already running.
  // Override with BASE_URL / API_URL env vars if using a remote env.
  // ------------------------------------------------------------------
  webServer: [
    {
      // Express API
      command: 'npm run server:dev --prefix ..',
      url: `${process.env.API_URL ?? 'http://localhost:3001'}/health`,
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      // Vite dev server
      command: 'npm run dev --prefix ..',
      url: baseURL,
      reuseExistingServer: true,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
