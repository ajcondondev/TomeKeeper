import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

test.describe('Reviews CRUD', { tag: '@regression' }, () => {
  let bookId: string | undefined;
  let reviewIds: string[] = [];

  test.beforeEach(async ({ apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookId = book.id;
  });

  test.afterEach(async ({ apiHelper }) => {
    for (const id of reviewIds) {
      await apiHelper.deleteReview(id).catch(() => {});
    }
    reviewIds = [];

    if (bookId) {
      await apiHelper.deleteBook(bookId).catch(() => {});
      bookId = undefined;
    }
  });

  // -------------------------------------------------------------------------
  // Add Review - Happy Path
  // -------------------------------------------------------------------------

  test.describe('Add Review - Happy Path', () => {
    test('adds a review and it appears on the reviews page', { tag: '@smoke' }, async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const reviewData = TestDataFactory.review(book.id);
      const bookOption = TestDataFactory.reviewBookOption(book.title, book.author);

      await reviewsPage.goto();
      await reviewsPage.addReview({
        bookOption,
        title: reviewData.title,
        review: reviewData.review,
      });

      const card = reviewsPage.getReviewCard(reviewData.title);

      await expect(card.titleHeading).toHaveText(reviewData.title);
      await expect(card.reviewText).toContainText(reviewData.review);

      // Store ID for cleanup.
      const reviews = await apiHelper.getReviews();
      reviewIds.push(...reviews.filter(r => r.title === reviewData.title).map(r => r.id));
    });

  });

  // -------------------------------------------------------------------------
  // Add Review - Validation
  // -------------------------------------------------------------------------

  test.describe('Add Review - Validation', () => {
    test('shows error when no book is selected', async ({ reviewsPage }) => {
      await reviewsPage.goto();
      await reviewsPage.addReviewButton.click();
      await reviewsPage.addReviewModal.titleInput.fill('Some Title');
      await reviewsPage.addReviewModal.reviewTextarea.fill('Some review text');
      await reviewsPage.addReviewModal.submitButton.click();

      await expect(reviewsPage.addReviewModal.fieldError('book')).toBeVisible();
    });

    test('shows error when review title is empty', async ({ reviewsPage, apiHelper }) => {
      const book = await apiHelper.getBook(bookId!);
      const bookOption = TestDataFactory.reviewBookOption(book.title, book.author);

      await reviewsPage.goto();
      await reviewsPage.addReviewButton.click();
      await reviewsPage.addReviewModal.bookSelect.selectOption(bookOption);
      await reviewsPage.addReviewModal.reviewTextarea.fill('Some review text');
      await reviewsPage.addReviewModal.submitButton.click();

      await expect(reviewsPage.addReviewModal.fieldError('title')).toBeVisible();
    });

    test('shows error when review text is empty', async ({ reviewsPage, apiHelper }) => {
      const book = await apiHelper.getBook(bookId!);
      const bookOption = TestDataFactory.reviewBookOption(book.title, book.author);

      await reviewsPage.goto();
      await reviewsPage.addReviewButton.click();
      await reviewsPage.addReviewModal.bookSelect.selectOption(bookOption);
      await reviewsPage.addReviewModal.titleInput.fill('A Review Title');
      await reviewsPage.addReviewModal.submitButton.click();

      await expect(reviewsPage.addReviewModal.fieldError('review')).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Edit Review
  // -------------------------------------------------------------------------

  test.describe('Edit Review', () => {
    test('edits a review title and it updates on the card', async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const review = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(review.id);

      const updatedTitle = 'Updated Review Title';

      await reviewsPage.goto();
      const card = reviewsPage.getReviewCard(review.title);
      await card.editButton.click();
      await reviewsPage.editReviewModal.fillAndSubmit({ title: updatedTitle });

      await expect(reviewsPage.getReviewCard(updatedTitle).titleHeading).toHaveText(updatedTitle);
    });

    test('edits a review body and it updates on the card', async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const review = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(review.id);

      const updatedReview = 'This is the updated review text after editing.';

      await reviewsPage.goto();
      const card = reviewsPage.getReviewCard(review.title);
      await card.editButton.click();
      await reviewsPage.editReviewModal.fillAndSubmit({ review: updatedReview });

      await expect(
        reviewsPage.getReviewCard(review.title).reviewText,
      ).toContainText(updatedReview);
    });

    test('pre-populates edit modal with existing review content', async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const review = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(review.id);

      await reviewsPage.goto();
      await reviewsPage.getReviewCard(review.title).editButton.click();

      await expect(reviewsPage.editReviewModal.titleInput).toHaveValue(review.title);
      await expect(reviewsPage.editReviewModal.reviewTextarea).toHaveValue(review.review);
    });
  });

  // -------------------------------------------------------------------------
  // Delete Review
  // -------------------------------------------------------------------------

  test.describe('Delete Review', () => {
    test('deletes a review and removes it from the page', { tag: '@smoke' }, async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const review = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(review.id);

      await reviewsPage.goto();
      const card = reviewsPage.getReviewCard(review.title);
      await card.deleteButton.click();

      await expect(card.titleHeading).toBeHidden();

      reviewIds = reviewIds.filter(id => id !== review.id);
    });

  });
});

// ---------------------------------------------------------------------------
// Review counts — exact-count assertions need an isolated user; the shared
// account's review count changes underneath parallel workers and browsers.
// ---------------------------------------------------------------------------

test.describe('Reviews CRUD — Counts', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  let api: ApiHelper;

  test.beforeEach(async ({ page }) => {
    api = new ApiHelper(page.request);
    const user = TestDataFactory.user();
    const response = await api.registerRaw(user.email, user.password);
    if (!response.ok()) throw new Error(`register failed: ${response.status()}`);
  });

  test('review count increments after adding a review', async ({ reviewsPage }) => {
    const book = await api.createBook(TestDataFactory.book());
    await api.createReview(TestDataFactory.review(book.id));
    const reviewData = TestDataFactory.review(book.id);
    const bookOption = TestDataFactory.reviewBookOption(book.title, book.author);

    await reviewsPage.goto();
    await reviewsPage.addReview({ bookOption, title: reviewData.title, review: reviewData.review });

    await expect(reviewsPage.reviewCount).toHaveText('2 reviews');
  });

  test('review count decrements after deleting a review', async ({ reviewsPage }) => {
    const book = await api.createBook(TestDataFactory.book());
    const reviewA = await api.createReview(TestDataFactory.review(book.id));
    await api.createReview(TestDataFactory.review(book.id));

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(reviewA.title).deleteButton.click();

    await expect(reviewsPage.reviewCount).toHaveText('1 review');
  });
});

// ---------------------------------------------------------------------------
// Reviews Empty State
//
// These tests need a guaranteed empty reviews list, so they register a fresh
// user inline rather than using the shared authenticated session.
// ---------------------------------------------------------------------------

test.describe('Reviews — Empty State', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('displays empty state message and Add Review button when no reviews exist', async ({
    registerPage,
    reviewsPage,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await reviewsPage.goto();

    await expect(reviewsPage.emptyStateMessage).toBeVisible();
    await expect(reviewsPage.emptyStateButton).toBeVisible();
  });

  test('new account shows no review count', async ({ registerPage, reviewsPage }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await reviewsPage.goto();

    await expect(reviewsPage.reviewCount).toBeHidden();
  });

  test('empty state Add Review button opens the Add Review modal', async ({
    registerPage,
    reviewsPage,
    page,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await reviewsPage.goto();
    await reviewsPage.emptyStateButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toBeVisible();
  });

  test('adding the first review replaces the empty state with the review card', async ({
    registerPage,
    libraryPage,
    reviewsPage,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    // A review requires a book — add one via the Library UI.
    const book = TestDataFactory.book();
    await libraryPage.goto();
    await libraryPage.addBook(book);

    // Wait for the book to persist before navigating — the Reviews page re-fetches
    // books for its dropdown, and goto() would otherwise race the in-flight POST.
    await expect(libraryPage.getBookCard(book.title).titleHeading).toBeVisible();

    // Add the first review via the empty state CTA.
    await reviewsPage.goto();
    await reviewsPage.emptyStateButton.click();
    await reviewsPage.addReviewModal.fillAndSubmit({
      bookOption: TestDataFactory.reviewBookOption(book.title, book.author),
      title: 'My First Review',
      review: 'This book was excellent.',
    });

    await expect(reviewsPage.emptyStateMessage).toBeHidden();
    await expect(reviewsPage.getReviewCard('My First Review').titleHeading).toBeVisible();
  });
});
