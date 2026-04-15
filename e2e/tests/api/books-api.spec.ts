import { test, expect } from '../../fixtures/base.fixture';
import { ApiHelper, TestDataFactory } from '../../utils';

const apiUrl = process.env.API_URL ?? 'http://localhost:3001';

test.describe('Books API Contract', { tag: '@regression' }, () => {
  let bookIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  // ---------------------------------------------------------------------------
  // GET /api/books
  // ---------------------------------------------------------------------------

  test.describe('GET /api/books', () => {
    test('returns 200 with empty array for a new user @smoke', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const user = TestDataFactory.user();
      await ctx.post(`${apiUrl}/api/auth/register`, { data: user });
      await ctx.post(`${apiUrl}/api/auth/login`, { data: user });

      const response = await ctx.get(`${apiUrl}/api/books`);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual([]);

      await ctx.dispose();
    });

    test('returns only the current user\'s books', async ({ apiHelper, playwright }) => {
      const bookA = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(bookA.id);

      const ctxB = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const userB = TestDataFactory.user();
      await ctxB.post(`${apiUrl}/api/auth/register`, { data: userB });
      await ctxB.post(`${apiUrl}/api/auth/login`, { data: userB });
      const apiB = new ApiHelper(ctxB);

      const booksB = await apiB.getBooks();
      await ctxB.dispose();

      expect(booksB.find(b => b.id === bookA.id)).toBeUndefined();
    });

    test('returns 401 for unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });

      const response = await ctx.get(`${apiUrl}/api/books`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // POST /api/books
  // ---------------------------------------------------------------------------

  test.describe('POST /api/books', () => {
    test('returns 201 with created book for valid title and author @smoke', async ({ apiHelper }) => {
      const book = TestDataFactory.book();

      const response = await apiHelper.createBookRaw(book);

      expect(response.status()).toBe(201);
      const body = await response.json();
      expect(body.data.title).toBe(book.title);
      expect(body.data.author).toBe(book.author);
      expect(body.data.id).toBeTruthy();
      expect(body.data.status).toBe('unread');

      bookIds.push(body.data.id);
    });

    test('returns 400 when title is missing', async ({ apiHelper }) => {
      const response = await apiHelper.createBookRaw({ title: '', author: 'Author' });

      expect(response.status()).toBe(400);
    });

    test('returns 400 when author is missing', async ({ apiHelper }) => {
      const response = await apiHelper.createBookRaw({ title: 'Title', author: '' });

      expect(response.status()).toBe(400);
    });

    test('returns 401 for unauthenticated request', async ({ playwright }) => {
      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });

      const response = await ctx.post(`${apiUrl}/api/books`, {
        data: { title: 'Test', author: 'Author' },
      });
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/books/{id}
  // ---------------------------------------------------------------------------

  test.describe('GET /api/books/{id}', () => {
    test('returns 200 with the book for a valid ID', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const response = await apiHelper.getBookRaw(book.id);

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.title).toBe(book.title);
      expect(body.data.author).toBe(book.author);
    });

    test('returns 404 for a non-existent book ID', async ({ apiHelper }) => {
      const response = await apiHelper.getBookRaw('00000000-0000-0000-0000-000000000000');

      expect(response.status()).toBe(404);
    });

    test('returns 403 or 404 when accessing another user\'s book', async ({ apiHelper, playwright }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const ctxB = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const userB = TestDataFactory.user();
      await ctxB.post(`${apiUrl}/api/auth/register`, { data: userB });
      await ctxB.post(`${apiUrl}/api/auth/login`, { data: userB });
      const apiB = new ApiHelper(ctxB);

      const response = await apiB.getBookRaw(book.id);
      await ctxB.dispose();

      expect([403, 404]).toContain(response.status());
    });

    test('returns 401 for unauthenticated request', async ({ apiHelper, playwright }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const response = await ctx.get(`${apiUrl}/api/books/${book.id}`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // PATCH /api/books/{id}
  // ---------------------------------------------------------------------------

  test.describe('PATCH /api/books/{id}', () => {
    test('returns 200 with updated book when status changes to "read"', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const response = await apiHelper.updateBookRaw(book.id, { status: 'read' });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.status).toBe('read');
    });

    test('accepts status "unread"', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const response = await apiHelper.updateBookRaw(book.id, { status: 'unread' });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.status).toBe('unread');
    });

    test('accepts status "want-to-read"', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const response = await apiHelper.updateBookRaw(book.id, { status: 'want-to-read' });

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.data.status).toBe('want-to-read');
    });

    test('returns 404 for a non-existent book ID', async ({ apiHelper }) => {
      const response = await apiHelper.updateBookRaw('00000000-0000-0000-0000-000000000000', {
        status: 'read',
      });

      expect(response.status()).toBe(404);
    });

    test('returns 401 for unauthenticated request', async ({ apiHelper, playwright }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const response = await ctx.patch(`${apiUrl}/api/books/${book.id}`, {
        data: { status: 'read' },
      });
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/books/{id}
  // ---------------------------------------------------------------------------

  test.describe('DELETE /api/books/{id}', () => {
    test('returns 200 or 204 for an existing book', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());

      const response = await apiHelper.deleteBookRaw(book.id);

      expect([200, 204]).toContain(response.status());
    });

    test('deleted book is no longer returned by GET /api/books', async ({ apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());

      await apiHelper.deleteBook(book.id);

      const books = await apiHelper.getBooks();
      expect(books.find(b => b.id === book.id)).toBeUndefined();
    });

    test('returns 404 for a non-existent book ID', async ({ apiHelper }) => {
      const response = await apiHelper.deleteBookRaw('00000000-0000-0000-0000-000000000000');

      expect(response.status()).toBe(404);
    });

    test('returns 401 for unauthenticated request', async ({ apiHelper, playwright }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      const ctx = await playwright.request.newContext({ storageState: { cookies: [], origins: [] } });
      const response = await ctx.delete(`${apiUrl}/api/books/${book.id}`);
      await ctx.dispose();

      expect(response.status()).toBe(401);
    });
  });

  // ---------------------------------------------------------------------------
  // UI Error Handling
  // ---------------------------------------------------------------------------

  test.describe('UI Error Handling', () => {
    test('library page displays error state when API returns 500', async ({ page, libraryPage }) => {
      await page.route('**/api/books', route =>
        route.fulfill({ status: 500, body: JSON.stringify({ success: false, message: 'Server Error' }) }),
      );

      await libraryPage.goto();

      await expect(page.getByText(/Something went wrong/i)).toBeVisible();
    });
  });
});
