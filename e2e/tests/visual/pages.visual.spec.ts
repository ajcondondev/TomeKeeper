import type { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

// ---------------------------------------------------------------------------
// Determinism helpers
//
// Every test here runs as a fresh user (registered via API on the page's own
// request context, so the session cookie lands in the page's cookie jar).
// This isolates screenshots from books/reviews created concurrently by other
// suites against the shared user. Content that still varies per run — the
// random user email in the sidebar and review dates — is masked. Book fixtures
// pin genre and pageCount because both render on the card.
// ---------------------------------------------------------------------------

const FIXED_BOOK = { genre: 'Fiction', pageCount: 320 };

async function registerFreshUser(page: Page): Promise<ApiHelper> {
  const api = new ApiHelper(page.request);
  const user = TestDataFactory.user();
  const response = await api.registerRaw(user.email, user.password);
  if (!response.ok()) {
    throw new Error(`visual setup: register failed with ${response.status()}`);
  }
  return api;
}

/** The sidebar footer paragraph showing the (randomised) user email. */
function sidebarEmail(page: Page) {
  return page.getByRole('complementary').locator('p');
}

/** Review card dates render the current day — mask them so baselines don't expire. */
function reviewDates(page: Page) {
  return page
    .getByTestId('review-card')
    .locator('p')
    .filter({ hasText: /^\w{3} \d{1,2}, \d{4}$/ });
}

// ---------------------------------------------------------------------------
// Auth pages — no session required
// ---------------------------------------------------------------------------

test.describe('Visual — Auth Pages', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page renders correctly', { tag: '@smoke' }, async ({ loginPage }) => {
    await loginPage.goto();

    await expect(loginPage.page).toHaveScreenshot('login-page.png');
  });

  test('registration page renders correctly', async ({ registerPage }) => {
    await registerPage.goto();

    await expect(registerPage.page).toHaveScreenshot('register-page.png');
  });

  test('login page error state renders correctly', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.submitCredentials('bad@example.com', 'wrongpass1');
    await expect(loginPage.errorAlert).toBeVisible();

    await expect(loginPage.page).toHaveScreenshot('login-page-error.png');
  });

  test('registration page validation error renders correctly', async ({ registerPage }) => {
    await registerPage.goto();
    // Fixed email: the address is visible in the screenshot, and registration
    // fails on the short password so no account is ever created for it.
    await registerPage.submitCredentials('visual-validation@example.com', 'short');
    await expect(registerPage.errorAlert).toBeVisible();

    await expect(registerPage.page).toHaveScreenshot('register-page-error.png');
  });
});

// ---------------------------------------------------------------------------
// Empty states — fresh users guarantee no existing data
// ---------------------------------------------------------------------------

test.describe('Visual — Empty States', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await registerFreshUser(page);
  });

  test('library page renders correctly in empty state', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    await expect(page).toHaveScreenshot('library-empty.png', { mask: [sidebarEmail(page)] });
  });

  test('reading list page renders correctly in empty state', async ({
    readingListPage,
    page,
  }) => {
    await readingListPage.goto();

    await expect(page).toHaveScreenshot('reading-list-empty.png', { mask: [sidebarEmail(page)] });
  });

  test('reviews page renders correctly in empty state', async ({ reviewsPage, page }) => {
    await reviewsPage.goto();

    await expect(page).toHaveScreenshot('reviews-empty.png', { mask: [sidebarEmail(page)] });
  });
});

// ---------------------------------------------------------------------------
// Populated pages — fresh user per test, fixed data created via API
// ---------------------------------------------------------------------------

test.describe('Visual — Populated Pages', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let api: ApiHelper;

  test.beforeEach(async ({ page }) => {
    api = await registerFreshUser(page);
  });

  test('library page renders correctly with books', { tag: '@smoke' }, async ({ libraryPage, page }) => {
    await api.createBook(
      TestDataFactory.book({ title: 'The Great Novel', author: 'Jane Author', ...FIXED_BOOK }),
    );

    await libraryPage.goto();

    await expect(page).toHaveScreenshot('library-with-books.png', { mask: [sidebarEmail(page)] });
  });

  test('reading list page renders correctly with books', async ({ readingListPage, page }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'A Book to Read', author: 'Jane Author', ...FIXED_BOOK }),
    );
    await api.updateBook(book.id, { status: 'want-to-read' });

    await readingListPage.goto();

    await expect(page).toHaveScreenshot('reading-list-with-books.png', {
      mask: [sidebarEmail(page)],
    });
  });

  test('reviews page renders correctly with reviews', async ({ reviewsPage, page }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'Reviewed Book', author: 'Jane Author', ...FIXED_BOOK }),
    );
    await api.createReview(
      TestDataFactory.review(book.id, { title: 'A Great Read', review: 'This book was fantastic.' }),
    );

    await reviewsPage.goto();

    await expect(page).toHaveScreenshot('reviews-with-reviews.png', {
      mask: [sidebarEmail(page), reviewDates(page)],
    });
  });

  test('sidebar renders correctly for an authenticated user', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    await expect(page.getByRole('complementary')).toHaveScreenshot('sidebar-authenticated.png', {
      mask: [sidebarEmail(page)],
    });
  });

  // ---------------------------------------------------------------------------
  // Status badge variants
  // ---------------------------------------------------------------------------

  test('book card renders correctly with "Unread" status', async ({ libraryPage }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'Unread Book', author: 'Author', ...FIXED_BOOK }),
    );

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-unread.png');
  });

  test('book card renders correctly with "Read" status', async ({ libraryPage }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'Read Book', author: 'Author', ...FIXED_BOOK }),
    );
    await api.updateBook(book.id, { status: 'read' });

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-read.png');
  });

  test('book card renders correctly with "Want to Read" status', async ({ libraryPage }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'Want to Read Book', author: 'Author', ...FIXED_BOOK }),
    );
    await api.updateBook(book.id, { status: 'want-to-read' });

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-want-to-read.png');
  });
});

// ---------------------------------------------------------------------------
// Modals — fresh user per test, fixed data created via API
// ---------------------------------------------------------------------------

test.describe('Visual — Modals', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let api: ApiHelper;

  test.beforeEach(async ({ page }) => {
    api = await registerFreshUser(page);
  });

  test('Add Book modal renders correctly in default state', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toHaveScreenshot(
      'modal-add-book-default.png',
    );
  });

  test('Add Book modal renders correctly with validation errors', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.submitButton.click();
    await expect(libraryPage.addBookModal.fieldError('title')).toBeVisible();

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toHaveScreenshot(
      'modal-add-book-validation.png',
    );
  });

  test('Add Review modal renders correctly in default state', async ({ reviewsPage, page }) => {
    await api.createBook(TestDataFactory.book({ title: 'Modal Book', author: 'Author', ...FIXED_BOOK }));

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toHaveScreenshot(
      'modal-add-review-default.png',
    );
  });

  test('Add Review modal renders correctly with validation errors', async ({
    reviewsPage,
    page,
  }) => {
    await api.createBook(TestDataFactory.book({ title: 'Modal Book', author: 'Author', ...FIXED_BOOK }));

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();
    await reviewsPage.addReviewModal.submitButton.click();
    await expect(reviewsPage.addReviewModal.fieldError('book')).toBeVisible();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toHaveScreenshot(
      'modal-add-review-validation.png',
    );
  });

  test('Edit Review modal renders correctly pre-populated', async ({ reviewsPage, page }) => {
    const book = await api.createBook(
      TestDataFactory.book({ title: 'Modal Book', author: 'Author', ...FIXED_BOOK }),
    );
    const review = await api.createReview(
      TestDataFactory.review(book.id, {
        title: 'My Review Title',
        review: 'This is the review text.',
      }),
    );

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(review.title).editButton.click();

    await expect(page.getByRole('dialog', { name: 'Edit Review' })).toHaveScreenshot(
      'modal-edit-review-prepopulated.png',
    );
  });
});
