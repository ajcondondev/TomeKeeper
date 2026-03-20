import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

test.describe('Reviews CRUD', () => {
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
    test('adds a review and it appears on the reviews page @smoke', async ({
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
      const created = reviews.find(r => r.title === reviewData.title);
      if (created) reviewIds.push(created.id);
    });

    test('review count increments after adding a review', async ({
      reviewsPage,
      apiHelper,
    }) => {
      // Pre-create a review via API so the count paragraph is visible.
      const book = await apiHelper.getBook(bookId!);
      const seed = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(seed.id);

      await reviewsPage.goto();
      const countText = await reviewsPage.reviewCount.textContent() ?? '0 reviews';
      const countBefore = parseInt(countText);

      const reviewData = TestDataFactory.review(book.id);
      const bookOption = TestDataFactory.reviewBookOption(book.title, book.author);
      await reviewsPage.addReview({ bookOption, title: reviewData.title, review: reviewData.review });

      const expectedCount = countBefore + 1;
      const expectedText = expectedCount === 1 ? '1 review' : `${expectedCount} reviews`;

      await expect(reviewsPage.reviewCount).toHaveText(expectedText);

      const reviews = await apiHelper.getReviews();
      const created = reviews.find(r => r.title === reviewData.title);
      if (created) reviewIds.push(created.id);
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
    test('deletes a review and removes it from the page @smoke', async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const review = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(review.id);

      await reviewsPage.goto();
      const card = reviewsPage.getReviewCard(review.title);
      await card.deleteButton.click();

      await expect(card.titleHeading).not.toBeVisible();

      reviewIds = reviewIds.filter(id => id !== review.id);
    });

    test('review count decrements after deleting a review', async ({
      reviewsPage,
      apiHelper,
    }) => {
      const book = await apiHelper.getBook(bookId!);
      const reviewA = await apiHelper.createReview(TestDataFactory.review(book.id));
      const reviewB = await apiHelper.createReview(TestDataFactory.review(book.id));
      reviewIds.push(reviewA.id, reviewB.id);

      await reviewsPage.goto();
      const countText = await reviewsPage.reviewCount.textContent() ?? '0 reviews';
      const countBefore = parseInt(countText);

      await reviewsPage.getReviewCard(reviewA.title).deleteButton.click();

      const expectedCount = countBefore - 1;
      const expectedText = expectedCount === 1 ? '1 review' : `${expectedCount} reviews`;

      await expect(reviewsPage.reviewCount).toHaveText(expectedText);

      reviewIds = reviewIds.filter(id => id !== reviewA.id);
    });
  });
});
