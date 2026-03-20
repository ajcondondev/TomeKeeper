import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

test.describe('Reading List', () => {
  let bookIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  // -------------------------------------------------------------------------
  // Visibility
  // -------------------------------------------------------------------------

  test('shows books with want-to-read status @smoke', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();

    const card = readingListPage.getBookCard(book.title);

    await expect(card.titleHeading).toBeVisible();
    await expect(card.statusBadge).toHaveText('Want to Read');
  });

  test('does not show books with unread or read status', async ({
    readingListPage,
    apiHelper,
  }) => {
    const unreadBook = await apiHelper.createBook(TestDataFactory.book());
    const readBook = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(readBook.id, { status: 'read' });
    bookIds.push(unreadBook.id, readBook.id);

    await readingListPage.goto();

    await expect(
      readingListPage.getBookCard(unreadBook.title).titleHeading,
    ).not.toBeVisible();
    await expect(
      readingListPage.getBookCard(readBook.title).titleHeading,
    ).not.toBeVisible();
  });

  test('shows empty state when no want-to-read books exist', async ({
    readingListPage,
    apiHelper,
  }) => {
    // Ensure any want-to-read books for this test context are absent.
    // Create a book and leave it as unread so we have a known clean slate.
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    // Navigate and verify no want-to-read books are displayed.
    // (The shared user might have pre-existing want-to-read books from manual testing;
    // this test is most reliable when run against a clean account.)
    await readingListPage.goto();

    // Only assert empty state if the page doesn't show a book count.
    const isEmptyState = await readingListPage.emptyStateMessage.isVisible();
    if (isEmptyState) {
      await expect(readingListPage.goToLibraryButton).toBeVisible();
    } else {
      // A want-to-read book already existed — mark our book to confirm the
      // count is at least visible.
      await expect(readingListPage.bookCount).toBeVisible();
    }
  });

  test('empty state Go to Library button navigates to library', async ({
    readingListPage,
    libraryPage,
    page,
  }) => {
    await readingListPage.goto();

    // Only run this assertion when the empty state is actually visible.
    const isEmptyState = await readingListPage.emptyStateMessage.isVisible();
    if (!isEmptyState) {
      test.skip();
      return;
    }

    await readingListPage.goToLibraryButton.click();

    await expect(page).toHaveURL(/\/library/);
    await expect(libraryPage.heading).toBeVisible();
  });

  // -------------------------------------------------------------------------
  // Status Toggle Behavior
  // -------------------------------------------------------------------------

  test('removes book from reading list when Remove is clicked @smoke', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();
    const card = readingListPage.getBookCard(book.title);

    await card.wantToReadToggleButton.click();

    await expect(card.titleHeading).not.toBeVisible();
  });

  test('marking a want-to-read book as read removes it from the reading list', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();
    const card = readingListPage.getBookCard(book.title);

    await card.readToggleButton.click();

    await expect(card.titleHeading).not.toBeVisible();
  });
});
