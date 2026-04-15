import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

// ---------------------------------------------------------------------------
// Reading List — authenticated tests using the shared test user
// ---------------------------------------------------------------------------

test.describe('Reading List', { tag: '@regression' }, () => {
  let bookIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  // -------------------------------------------------------------------------
  // Visibility and Filtering
  // -------------------------------------------------------------------------

  test('shows books with want-to-read status', { tag: '@smoke' }, async ({ readingListPage, apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();

    await expect(readingListPage.getBookCard(book.title).titleHeading).toBeVisible();
    await expect(readingListPage.getBookCard(book.title).statusBadge).toHaveText('Want to Read');
  });

  test('does not show books with unread status', async ({ readingListPage, apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await readingListPage.goto();

    await expect(readingListPage.getBookCard(book.title).titleHeading).not.toBeVisible();
  });

  test('does not show books with read status', async ({ readingListPage, apiHelper }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'read' });
    bookIds.push(book.id);

    await readingListPage.goto();

    await expect(readingListPage.getBookCard(book.title).titleHeading).not.toBeVisible();
  });

  test('shows correct book count for want-to-read books', async ({
    readingListPage,
    apiHelper,
  }) => {
    const bookA = await apiHelper.createBook(TestDataFactory.book());
    const bookB = await apiHelper.createBook(TestDataFactory.book());
    const bookC = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(bookA.id, { status: 'want-to-read' });
    await apiHelper.updateBook(bookB.id, { status: 'want-to-read' });
    await apiHelper.updateBook(bookC.id, { status: 'want-to-read' });
    bookIds.push(bookA.id, bookB.id, bookC.id);

    await readingListPage.goto();

    const countText = await readingListPage.bookCount.textContent() ?? '';
    const count = parseInt(countText);

    expect(count).toBeGreaterThanOrEqual(3);
  });

  // -------------------------------------------------------------------------
  // Status Transitions
  // -------------------------------------------------------------------------

  test('removes book from reading list when Remove is clicked', { tag: '@smoke' }, async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();
    await readingListPage.getBookCard(book.title).wantToReadToggleButton.click();

    await expect(readingListPage.getBookCard(book.title).titleHeading).not.toBeVisible();
  });

  test('marking a want-to-read book as read removes it from the reading list', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();
    await readingListPage.getBookCard(book.title).readToggleButton.click();

    await expect(readingListPage.getBookCard(book.title).titleHeading).not.toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Library Synchronisation
  // -------------------------------------------------------------------------

  test('book added to reading list from library appears on reading list', async ({
    libraryPage,
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await libraryPage.goto();
    await libraryPage.getBookCard(book.title).wantToReadToggleButton.click();

    await readingListPage.goto();

    await expect(readingListPage.getBookCard(book.title).titleHeading).toBeVisible();
  });

  test('book removed from reading list reverts to Unread status in library', async ({
    readingListPage,
    libraryPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();
    await readingListPage.getBookCard(book.title).wantToReadToggleButton.click();

    await libraryPage.goto();

    await expect(libraryPage.getBookCard(book.title).statusBadge).toHaveText('Unread');
  });
});

// ---------------------------------------------------------------------------
// Reading List Empty State
//
// These tests need a guaranteed empty reading list (no want-to-read books),
// so they use a fresh registered user rather than the shared session.
// ---------------------------------------------------------------------------

test.describe('Reading List — Empty State', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('displays empty state message and Go to Library button when no want-to-read books', async ({
    registerPage,
    readingListPage,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await readingListPage.goto();

    await expect(readingListPage.emptyStateMessage).toBeVisible();
    await expect(readingListPage.goToLibraryButton).toBeVisible();
  });

  test('Go to Library button navigates to the Library page', async ({
    registerPage,
    readingListPage,
    libraryPage,
    page,
  }) => {
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    await readingListPage.goto();
    await readingListPage.goToLibraryButton.click();

    await expect(page).toHaveURL(/\/library/);
    await expect(libraryPage.heading).toBeVisible();
  });

  test('removing the last want-to-read book transitions back to empty state', async ({
    registerPage,
    libraryPage,
    readingListPage,
  }) => {
    // Register a fresh user so we control the exact reading-list state.
    await registerPage.goto();
    await registerPage.register(TestDataFactory.email(), TestDataFactory.password());

    // Add a book and mark it as want-to-read via the library UI.
    const book = TestDataFactory.book();
    await libraryPage.goto();
    await libraryPage.addBook(book);
    await libraryPage.getBookCard(book.title).wantToReadToggleButton.click();

    // Remove it from the reading list — the empty state should reappear.
    await readingListPage.goto();
    await readingListPage.getBookCard(book.title).wantToReadToggleButton.click();

    await expect(readingListPage.emptyStateMessage).toBeVisible();
  });
});
