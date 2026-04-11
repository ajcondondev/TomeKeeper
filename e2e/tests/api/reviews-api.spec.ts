import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

test.describe('Reviews API Contract', () => {
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

  // ---------------------------------------------------------------------------
  // GET /api/reviews
  // ---------------------------------------------------------------------------

  test.describe('GET /api/reviews', () => {
    test('returns 200 with empty array for a user with no reviews @smoke', async ({ playwright }) => {
      const ctx = await playwright.request.newContext();
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });
      const book = await new ApiHelper(ctx).createBook(TestDataFactory.book());

      const response = await ctx.get(`${apiUrl}/api/reviews`);
      await new ApiHelper(ctx).deleteBook(book.id).catch(() => {});
      await ctx.dispose();

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);
    });

    test('returns all reviews for the current user', async ({ apiHelper }) => {
      const r1 = await apiHelper.createReview(TestDataFactory.review(bookId!));
      const r2 = await apiHelper.createReview(TestDataFactory.review(bookId!));
      const r3 = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(r1.id, r2.id, r3.id);

      const response = await apiHelper.getReviewsRaw();

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.length).toBeGreaterThanOrEqual(3);
      const ids = body.data.map((r: { id: string }) => r.id);
      expect(ids).toContain(r1.id);
      expect(ids).toContain(r2.id);
      expect(ids).toContain(r3.id);
    });

    test('returns only the current user\'s reviews', async ({ apiHelper, playwright }) => {
      const reviewA = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(reviewA.id);

      const ctxB = await playwright.request.newContext();
      const userB = TestDataFactory.user();
      await ctxB.post(`${apiUrl}/api/auth/register`, { data: userB });
      await ctxB.post(`${apiUrl}/api/auth/login`, { data: userB });

      const reviewsB = await ctxB.get(`${apiUrl}/api/reviews`);
      await ctxB.dispose();

      const body = await reviewsB.json();
      const ids = body.data.map((r: { id: string }) => r.id);
      expect(ids).not.toContain(reviewA.id);
    });

    test('returns 401 for unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext();

      const response = await ctx.get(`${apiUrl}/api/reviews`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/reviews
  // ---------------------------------------------------------------------------

  test.describe('POST /api/reviews', () => {
    test('returns 201 with created review for a valid payload @smoke', async ({ apiHelper }) => {
      const review = TestDataFactory.review(bookId!);

      const response = await apiHelper.createReviewRaw(review);

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.data.title).toBe(review.title);
      expect(body.data.review).toBe(review.review);
      expect(body.data.id).toBeTruthy();
      expect(body.data.bookId).toBe(bookId!);

      reviewIds.push(body.data.id);
    });

    test('returns 400 when bookId is missing', async ({ apiHelper }) => {
      const response = await apiHelper.createReviewRaw({
        bookId: '',
        title: 'A Title',
        review: 'A review body.',
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when title is missing', async ({ apiHelper }) => {
      const response = await apiHelper.createReviewRaw({
        bookId: bookId!,
        title: '',
        review: 'A review body.',
      });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when review body is missing', async ({ apiHelper }) => {
      const response = await apiHelper.createReviewRaw({
        bookId: bookId!,
        title: 'A Title',
        review: '',
      });

      expect(response.status()).toBe(400);
    });

    test('returns 404 or 400 when bookId references a non-existent book', async ({ apiHelper }) => {
      const response = await apiHelper.createReviewRaw({
        bookId: '00000000-0000-0000-0000-000000000000',
        title: 'A Title',
        review: 'A review body.',
      });

      expect([400, 404]).toContain(response.status());
    });

    test('returns 401 for unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext();

      const response = await ctx.post(`${apiUrl}/api/reviews`, {
        data: { bookId: bookId!, title: 'A Title', review: 'A review.' },
      });
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/reviews/{id}
  // ---------------------------------------------------------------------------

  test.describe('PATCH /api/reviews/{id}', () => {
    test('returns 200 with updated title', async ({ apiHelper }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(review.id);

      const updatedTitle = 'Updated Review Title';
      const response = await apiHelper.updateReviewRaw(review.id, { title: updatedTitle });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.title).toBe(updatedTitle);
    });

    test('can update review body without changing the title', async ({ apiHelper }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(review.id);

      const updatedReview = 'This is the updated review body.';
      const response = await apiHelper.updateReviewRaw(review.id, { review: updatedReview });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.review).toBe(updatedReview);
      expect(body.data.title).toBe(review.title);
    });

    test('returns 404 for a non-existent review ID', async ({ apiHelper }) => {
      const response = await apiHelper.updateReviewRaw('00000000-0000-0000-0000-000000000000', {
        title: 'New Title',
      });

      expect(response.status()).toBe(404);
    });

    test('returns 401 for unauthenticated request', async ({ apiHelper, playwright }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(review.id);

      const ctx = await playwright.request.newContext();
      const response = await ctx.patch(`${apiUrl}/api/reviews/${review.id}`, {
        data: { title: 'New Title' },
      });
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/reviews/{id}
  // ---------------------------------------------------------------------------

  test.describe('DELETE /api/reviews/{id}', () => {
    test('returns 200 or 204 for an existing review', async ({ apiHelper }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));

      const response = await apiHelper.deleteReviewRaw(review.id);

      expect([200, 204]).toContain(response.status());
    });

    test('deleted review is not returned by GET /api/reviews', async ({ apiHelper }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));

      await apiHelper.deleteReview(review.id);

      const reviews = await apiHelper.getReviews();
      expect(reviews.find(r => r.id === review.id)).toBeUndefined();
    });

    test('returns 404 for a non-existent review ID', async ({ apiHelper }) => {
      const response = await apiHelper.deleteReviewRaw('00000000-0000-0000-0000-000000000000');

      expect(response.status()).toBe(404);
    });

    test('returns 401 for unauthenticated request', async ({ apiHelper, playwright }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(review.id);

      const ctx = await playwright.request.newContext();
      const response = await ctx.delete(`${apiUrl}/api/reviews/${review.id}`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // Cascading Behavior
  // ---------------------------------------------------------------------------

  test.describe('Cascading Behavior', () => {
    test('GET /api/reviews returns a consistent response after the linked book is deleted @edge', async ({
      apiHelper,
    }) => {
      const review = await apiHelper.createReview(TestDataFactory.review(bookId!));
      reviewIds.push(review.id);

      await apiHelper.deleteBook(bookId!).catch(() => {});
      bookId = undefined;

      const response = await apiHelper.getReviewsRaw();

      expect(response.status()).toBe(200);
    });
  });
});
