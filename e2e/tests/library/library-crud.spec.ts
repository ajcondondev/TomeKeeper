import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

test.describe('Library CRUD', () => {
  // Tracks book IDs created during each test so afterEach can clean up.
  let bookIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  // -------------------------------------------------------------------------
  // Add Book - Happy Path
  // -------------------------------------------------------------------------

  test.describe('Add Book - Happy Path', () => {
    test('adds a book and it appears in the library @smoke', async ({ libraryPage, apiHelper }) => {
      const book = TestDataFactory.book();

      await libraryPage.goto();
      await libraryPage.addBook(book);

      const card = libraryPage.getBookCard(book.title);

      await expect(card.titleHeading).toHaveText(book.title);
      await expect(card.authorText).toContainText(book.author);
      await expect(card.statusBadge).toHaveText('Unread');

      const books = await apiHelper.getBooks();
      const created = books.find(b => b.title === book.title);
      if (created) bookIds.push(created.id);
    });

    test('book count increments after adding a book', async ({ libraryPage, apiHelper }) => {
      // Pre-create one book so the count paragraph is visible.
      const seed = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(seed.id);

      await libraryPage.goto();
      const countText = await libraryPage.bookCount.textContent() ?? '0 books';
      const countBefore = parseInt(countText);

      const newBook = TestDataFactory.book();
      await libraryPage.addBook(newBook);

      const expectedCount = countBefore + 1;
      const expectedText = expectedCount === 1 ? '1 book' : `${expectedCount} books`;

      await expect(libraryPage.bookCount).toHaveText(expectedText);

      const books = await apiHelper.getBooks();
      const created = books.find(b => b.title === newBook.title);
      if (created) bookIds.push(created.id);
    });

    test('adds a book with optional genre and page count', async ({ libraryPage, apiHelper }) => {
      const book = TestDataFactory.book({ genre: 'Science Fiction', pageCount: 412 });

      await libraryPage.goto();
      await libraryPage.addBook(book);

      await expect(libraryPage.getBookCard(book.title).titleHeading).toBeVisible();

      const books = await apiHelper.getBooks();
      const created = books.find(b => b.title === book.title);
      if (created) bookIds.push(created.id);
    });
  });

  // -------------------------------------------------------------------------
  // Add Book - Validation
  // -------------------------------------------------------------------------

  test.describe('Add Book - Validation', () => {
    test('shows error when title is empty', async ({ libraryPage }) => {
      await libraryPage.goto();
      await libraryPage.addBookButton.click();
      await libraryPage.addBookModal.authorInput.fill('Some Author');
      await libraryPage.addBookModal.submitButton.click();

      await expect(libraryPage.addBookModal.fieldError('title')).toBeVisible();
    });

    test('shows error when author is empty', async ({ libraryPage }) => {
      await libraryPage.goto();
      await libraryPage.addBookButton.click();
      await libraryPage.addBookModal.titleInput.fill('Some Title');
      await libraryPage.addBookModal.submitButton.click();

      await expect(libraryPage.addBookModal.fieldError('author')).toBeVisible();
    });

    test('modal stays open after validation error', async ({ libraryPage, page }) => {
      await libraryPage.goto();
      await libraryPage.addBookButton.click();
      await libraryPage.addBookModal.submitButton.click();

      await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();
    });
  });

  // -------------------------------------------------------------------------
  // Delete Book
  // -------------------------------------------------------------------------

  test.describe('Delete Book', () => {
    test('deletes a book and removes it from the library @smoke', async ({
      libraryPage,
      apiHelper,
    }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      await card.deleteButton.click();

      await expect(card.titleHeading).not.toBeVisible();

      // Remove from cleanup list — already deleted via UI.
      bookIds = bookIds.filter(id => id !== book.id);
    });

    test('book count decrements after deleting a book', async ({ libraryPage, apiHelper }) => {
      const bookA = await apiHelper.createBook(TestDataFactory.book());
      const bookB = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(bookA.id, bookB.id);

      await libraryPage.goto();
      const countText = await libraryPage.bookCount.textContent() ?? '0 books';
      const countBefore = parseInt(countText);

      await libraryPage.getBookCard(bookA.title).deleteButton.click();

      const expectedCount = countBefore - 1;
      const expectedText = expectedCount === 1 ? '1 book' : `${expectedCount} books`;

      await expect(libraryPage.bookCount).toHaveText(expectedText);

      bookIds = bookIds.filter(id => id !== bookA.id);
    });
  });

  // -------------------------------------------------------------------------
  // Book Status Transitions
  // -------------------------------------------------------------------------

  test.describe('Book Status Transitions', () => {
    test('marks book as read and updates status badge @smoke', async ({
      libraryPage,
      apiHelper,
    }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      await expect(card.statusBadge).toHaveText('Unread');

      await card.readToggleButton.click();

      await expect(card.statusBadge).toHaveText('Read');
      await expect(card.readToggleButton).toHaveText('Unread');
    });

    test('toggles book back to unread after marking as read', async ({
      libraryPage,
      apiHelper,
    }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      await card.readToggleButton.click(); // unread → read
      await card.readToggleButton.click(); // read → unread

      await expect(card.statusBadge).toHaveText('Unread');
      await expect(card.readToggleButton).toHaveText('Read');
    });

    test('adds book to reading list via Want to Read', async ({ libraryPage, apiHelper }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      await card.wantToReadToggleButton.click();

      await expect(card.statusBadge).toHaveText('Want to Read');
      await expect(card.wantToReadToggleButton).toHaveText('Remove');
    });

    test('removes book from reading list and resets to unread', async ({
      libraryPage,
      apiHelper,
    }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      await apiHelper.updateBook(book.id, { status: 'want-to-read' });
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      await card.wantToReadToggleButton.click(); // want-to-read → unread

      await expect(card.statusBadge).toHaveText('Unread');
      await expect(card.wantToReadToggleButton).toHaveText('Want to Read');
    });

    test('full status cycle: unread → read → want-to-read → unread', async ({
      libraryPage,
      apiHelper,
    }) => {
      const book = await apiHelper.createBook(TestDataFactory.book());
      bookIds.push(book.id);

      await libraryPage.goto();
      const card = libraryPage.getBookCard(book.title);

      // Start: unread
      await expect(card.statusBadge).toHaveText('Unread');

      // → read
      await card.readToggleButton.click();
      await expect(card.statusBadge).toHaveText('Read');

      // → unread
      await card.readToggleButton.click();
      await expect(card.statusBadge).toHaveText('Unread');

      // → want-to-read
      await card.wantToReadToggleButton.click();
      await expect(card.statusBadge).toHaveText('Want to Read');

      // → unread
      await card.wantToReadToggleButton.click();
      await expect(card.statusBadge).toHaveText('Unread');
    });
  });
});

// ---------------------------------------------------------------------------
// Library Empty State
//
// These tests need a guaranteed empty library, so they use a fresh user
// registered inline rather than the shared authenticated session.
// ---------------------------------------------------------------------------

test.describe('Library Empty State', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('displays empty state message and Add Book button when library has no books', async ({
    registerPage,
    libraryPage,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await expect(libraryPage.emptyStateMessage).toBeVisible();
    await expect(libraryPage.emptyStateButton).toBeVisible();
  });

  test('empty state Add Book button opens the Add Book modal', async ({
    registerPage,
    libraryPage,
    page,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await libraryPage.emptyStateButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();
  });

  test('adding the first book replaces the empty state with the book card', async ({
    registerPage,
    libraryPage,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    const book = TestDataFactory.book();
    await libraryPage.emptyStateButton.click();
    await libraryPage.addBookModal.fillAndSubmit(book);

    await expect(libraryPage.emptyStateMessage).not.toBeVisible();
    await expect(libraryPage.getBookCard(book.title).titleHeading).toBeVisible();
  });

  test('new account starts with an empty library', async ({ registerPage, libraryPage }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await expect(libraryPage.emptyStateMessage).toBeVisible();
    await expect(libraryPage.bookCount).not.toBeVisible();
  });
});
