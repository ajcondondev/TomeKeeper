import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

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
    await registerPage.submitCredentials(TestDataFactory.email(), 'short');
    await expect(registerPage.errorAlert).toBeVisible();

    await expect(registerPage.page).toHaveScreenshot('register-page-error.png');
  });
});

// ---------------------------------------------------------------------------
// Empty states — fresh users to guarantee no existing data
// ---------------------------------------------------------------------------

test.describe('Visual — Empty States', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('library page renders correctly in empty state', async ({ registerPage, libraryPage }) => {
    const user = TestDataFactory.user();
    await registerPage.goto();
    await registerPage.register(user.email, user.password);

    await libraryPage.goto();

    await expect(libraryPage.page).toHaveScreenshot('library-empty.png');
  });

  test('reading list page renders correctly in empty state', async ({
    registerPage,
    readingListPage,
  }) => {
    const user = TestDataFactory.user();
    await registerPage.goto();
    await registerPage.register(user.email, user.password);

    await readingListPage.goto();

    await expect(readingListPage.page).toHaveScreenshot('reading-list-empty.png');
  });

  test('reviews page renders correctly in empty state', async ({ registerPage, reviewsPage }) => {
    const user = TestDataFactory.user();
    await registerPage.goto();
    await registerPage.register(user.email, user.password);

    await reviewsPage.goto();

    await expect(reviewsPage.page).toHaveScreenshot('reviews-empty.png');
  });
});

// ---------------------------------------------------------------------------
// Populated pages — shared authenticated user, data created and cleaned up per test
// ---------------------------------------------------------------------------

test.describe('Visual — Populated Pages', { tag: '@regression' }, () => {
  let bookIds: string[] = [];
  let reviewIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of reviewIds) {
      await apiHelper.deleteReview(id).catch(() => {});
    }
    reviewIds = [];

    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  test('library page renders correctly with books', { tag: '@smoke' }, async ({ libraryPage, apiHelper }) => {
    const book = await apiHelper.createBook(
      TestDataFactory.book({ title: 'The Great Novel', author: 'Jane Author' }),
    );
    bookIds.push(book.id);

    await libraryPage.goto();

    await expect(libraryPage.page).toHaveScreenshot('library-with-books.png');
  });

  test('reading list page renders correctly with books', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(
      TestDataFactory.book({ title: 'A Book to Read', author: 'Jane Author' }),
    );
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();

    await expect(readingListPage.page).toHaveScreenshot('reading-list-with-books.png');
  });

  test('reviews page renders correctly with reviews', async ({ reviewsPage, apiHelper }) => {
    const book = await apiHelper.createBook(
      TestDataFactory.book({ title: 'Reviewed Book', author: 'Jane Author' }),
    );
    bookIds.push(book.id);
    const review = await apiHelper.createReview(
      TestDataFactory.review(book.id, { title: 'A Great Read', review: 'This book was fantastic.' }),
    );
    reviewIds.push(review.id);

    await reviewsPage.goto();

    await expect(reviewsPage.page).toHaveScreenshot('reviews-with-reviews.png');
  });

  test('sidebar renders correctly for an authenticated user', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    await expect(page.getByRole('complementary')).toHaveScreenshot('sidebar-authenticated.png');
  });

  // ---------------------------------------------------------------------------
  // Status badge variants
  // ---------------------------------------------------------------------------

  test('book card renders correctly with "Unread" status', async ({ libraryPage, apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book({ title: 'Unread Book', author: 'Author' }));
    bookIds.push(book.id);

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-unread.png');
  });

  test('book card renders correctly with "Read" status', async ({ libraryPage, apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book({ title: 'Read Book', author: 'Author' }));
    await apiHelper.updateBook(book.id, { status: 'read' });
    bookIds.push(book.id);

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-read.png');
  });

  test('book card renders correctly with "Want to Read" status', async ({
    libraryPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(
      TestDataFactory.book({ title: 'Want to Read Book', author: 'Author' }),
    );
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await libraryPage.goto();
    const card = libraryPage.getBookCard(book.title);

    await expect(card.statusBadge).toHaveScreenshot('status-badge-want-to-read.png');
  });
});

// ---------------------------------------------------------------------------
// Modals — shared authenticated user
// ---------------------------------------------------------------------------

test.describe('Visual — Modals', { tag: '@regression' }, () => {
  let bookIds: string[] = [];
  let reviewIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of reviewIds) {
      await apiHelper.deleteReview(id).catch(() => {});
    }
    reviewIds = [];

    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
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

  test('Add Review modal renders correctly in default state', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toHaveScreenshot(
      'modal-add-review-default.png',
    );
  });

  test('Add Review modal renders correctly with validation errors', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();
    await reviewsPage.addReviewModal.submitButton.click();
    await expect(reviewsPage.addReviewModal.fieldError('book')).toBeVisible();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toHaveScreenshot(
      'modal-add-review-validation.png',
    );
  });

  test('Edit Review modal renders correctly pre-populated', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);
    const review = await apiHelper.createReview(
      TestDataFactory.review(book.id, {
        title: 'My Review Title',
        review: 'This is the review text.',
      }),
    );
    reviewIds.push(review.id);

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(review.title).editButton.click();

    await expect(page.getByRole('dialog', { name: 'Edit Review' })).toHaveScreenshot(
      'modal-edit-review-prepopulated.png',
    );
  });
});
