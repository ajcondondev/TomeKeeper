import { test as base } from '@playwright/test';
import { LoginPage, RegisterPage, LibraryPage, ReadingListPage, ReviewsPage } from '../pages';
import { ApiHelper } from '../utils';

/**
 * Extended fixture type providing all page objects and the API helper.
 *
 * Import `test` and `expect` from this file in specs that use page objects:
 *   import { test, expect } from '../../fixtures/base.fixture';
 *
 * For simple API-only tests that don't use page objects, importing directly
 * from '@playwright/test' is fine.
 */
type TestFixtures = {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  libraryPage: LibraryPage;
  readingListPage: ReadingListPage;
  reviewsPage: ReviewsPage;
  apiHelper: ApiHelper;
};

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  libraryPage: async ({ page }, use) => {
    await use(new LibraryPage(page));
  },

  readingListPage: async ({ page }, use) => {
    await use(new ReadingListPage(page));
  },

  reviewsPage: async ({ page }, use) => {
    await use(new ReviewsPage(page));
  },

  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },
});

export { expect } from '@playwright/test';
