import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

// ---------------------------------------------------------------------------
// Mobile Viewport Tests (390×844 — iPhone 14)
//
// The app ships a responsive layout:
//  - Desktop (≥768px): sidebar navigation + no tab bar
//  - Mobile  (<768px): tab bar in header + sidebar hidden
//
// These tests assert mobile-specific layout behaviour and verify core user
// journeys at a narrow viewport. They run in a dedicated "mobile" Playwright
// project so they do not inflate the cross-browser matrix for desktop specs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Layout — sidebar and navigation
// ---------------------------------------------------------------------------

test.describe('Mobile Layout — Navigation', () => {
  test('sidebar is hidden on mobile @smoke', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // The <aside> has `hidden md:flex` — display:none below md breakpoint.
    await expect(page.getByRole('complementary')).not.toBeVisible();
  });

  test('mobile tab bar is visible on mobile @smoke', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // The tab nav is inside the <header> (role="banner"), md:hidden on desktop.
    await expect(page.getByRole('banner').getByRole('navigation')).toBeVisible();
  });

  test('mobile tab bar contains links to all main sections', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    const nav = page.getByRole('banner').getByRole('navigation');

    await expect(nav.getByRole('link', { name: 'Library' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Reading List' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Reviews' })).toBeVisible();
  });

  test('tapping the Reading List tab navigates to the reading list', async ({
    libraryPage,
    readingListPage,
    page,
  }) => {
    await libraryPage.goto();

    await page.getByRole('banner').getByRole('link', { name: 'Reading List' }).click();

    await expect(page).toHaveURL(/\/reading-list/);
    await expect(readingListPage.heading).toBeVisible();
  });

  test('tapping the Reviews tab navigates to reviews', async ({
    libraryPage,
    reviewsPage,
    page,
  }) => {
    await libraryPage.goto();

    await page.getByRole('banner').getByRole('link', { name: 'Reviews' }).click();

    await expect(page).toHaveURL(/\/reviews/);
    await expect(reviewsPage.heading).toBeVisible();
  });

  test('tapping the Library tab navigates back to library', async ({
    reviewsPage,
    libraryPage,
    page,
  }) => {
    await reviewsPage.goto();

    await page.getByRole('banner').getByRole('link', { name: 'Library' }).click();

    await expect(page).toHaveURL(/\/library/);
    await expect(libraryPage.heading).toBeVisible();
  });

  test('sign-out button is visible in the header on mobile', async ({ libraryPage, page }) => {
    await libraryPage.goto();

    // The navbar renders a mobile-only sign-out icon button (md:hidden).
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Core functionality at mobile viewport
// ---------------------------------------------------------------------------

test.describe('Mobile Layout — Core Functionality', () => {
  let bookIds: string[] = [];

  test.afterEach(async ({ apiHelper }) => {
    for (const id of bookIds) {
      await apiHelper.deleteBook(id).catch(() => {});
    }
    bookIds = [];
  });

  test('library page renders book cards at mobile viewport @smoke', async ({
    libraryPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(
      TestDataFactory.book({ title: 'Mobile Test Book', author: 'Mobile Author' }),
    );
    bookIds.push(book.id);

    await libraryPage.goto();

    await expect(libraryPage.getBookCard(book.title).titleHeading).toBeVisible();
  });

  test('Add Book button opens the modal on mobile', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();
  });

  test('book can be added and appears in the library at mobile viewport @regression', async ({
    libraryPage,
    apiHelper,
  }) => {
    const book = TestDataFactory.book();

    await libraryPage.goto();
    await libraryPage.addBook(book);

    await expect(libraryPage.getBookCard(book.title).titleHeading).toBeVisible();

    const books = await apiHelper.getBooks();
    const created = books.find(b => b.title === book.title);
    if (created) bookIds.push(created.id);
  });

  test('reading list page renders at mobile viewport', async ({
    readingListPage,
    apiHelper,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    await apiHelper.updateBook(book.id, { status: 'want-to-read' });
    bookIds.push(book.id);

    await readingListPage.goto();

    await expect(readingListPage.getBookCard(book.title).titleHeading).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Auth pages at mobile viewport
// ---------------------------------------------------------------------------

test.describe('Mobile Layout — Auth Pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page is usable at mobile viewport @smoke', async ({ loginPage, page }) => {
    await loginPage.goto();

    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('registration page is usable at mobile viewport', async ({ registerPage, page }) => {
    await registerPage.goto();

    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
  });
});
