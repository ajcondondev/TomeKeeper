import { test, expect } from '../../fixtures/base.fixture';

const OPEN_LIBRARY_SEARCH = '**/openlibrary.org/search.json*';

// ---------------------------------------------------------------------------
// Find Cover — Open Library integration
//
// The AddBookModal fetches https://openlibrary.org/search.json when the user
// clicks "Find Cover". All tests mock the outbound request so the suite is
// hermetic and does not depend on the external API being available.
// ---------------------------------------------------------------------------

test.describe('Find Cover — Open Library Integration', () => {

  // -------------------------------------------------------------------------
  // Button state
  // -------------------------------------------------------------------------

  test('Find Cover button is disabled when title is empty @smoke', async ({ libraryPage }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await expect(libraryPage.addBookModal.findCoverButton).toBeDisabled();
  });

  test('Find Cover button becomes enabled after a title is entered @regression', async ({
    libraryPage,
  }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await libraryPage.addBookModal.titleInput.fill('Dune');

    await expect(libraryPage.addBookModal.findCoverButton).toBeEnabled();
  });

  test('Find Cover button becomes disabled again when title is cleared @regression', async ({
    libraryPage,
  }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await libraryPage.addBookModal.titleInput.fill('Dune');
    await expect(libraryPage.addBookModal.findCoverButton).toBeEnabled();

    await libraryPage.addBookModal.titleInput.clear();

    await expect(libraryPage.addBookModal.findCoverButton).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test('populates cover URL field when Open Library returns a cover ID @smoke', async ({
    libraryPage,
    page,
  }) => {
    await page.route(OPEN_LIBRARY_SEARCH, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ docs: [{ cover_i: 12345 }] }),
      }),
    );

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Dune');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverUrlInput).toHaveValue(
      'https://covers.openlibrary.org/b/id/12345-M.jpg',
    );
  });

  test('includes title and author in the Open Library request @regression', async ({
    libraryPage,
    page,
  }) => {
    let capturedUrl = '';

    await page.route(OPEN_LIBRARY_SEARCH, route => {
      capturedUrl = route.request().url();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ docs: [{ cover_i: 99999 }] }),
      });
    });

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Dune');
    await libraryPage.addBookModal.authorInput.fill('Frank Herbert');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverUrlInput).toHaveValue(
      'https://covers.openlibrary.org/b/id/99999-M.jpg',
    );

    expect(capturedUrl).toContain('title=Dune');
    expect(capturedUrl).toContain('author=Frank%20Herbert');
  });

  // -------------------------------------------------------------------------
  // Error states
  // -------------------------------------------------------------------------

  test('shows "No cover found" error when Open Library returns no results @smoke', async ({
    libraryPage,
    page,
  }) => {
    await page.route(OPEN_LIBRARY_SEARCH, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ docs: [] }),
      }),
    );

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Definitely Not a Real Book XYZ123');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverFetchError).toBeVisible();
    await expect(libraryPage.addBookModal.coverFetchError).toContainText('No cover found');
  });

  test('shows network error message when Open Library is unreachable @regression', async ({
    libraryPage,
    page,
  }) => {
    await page.route(OPEN_LIBRARY_SEARCH, route => route.abort('failed'));

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Any Book Title');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverFetchError).toBeVisible();
    await expect(libraryPage.addBookModal.coverFetchError).toContainText('Could not reach Open Library');
  });

  test('shows network error message when Open Library returns a non-OK status @regression', async ({
    libraryPage,
    page,
  }) => {
    await page.route(OPEN_LIBRARY_SEARCH, route =>
      route.fulfill({ status: 503, body: 'Service Unavailable' }),
    );

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Any Book Title');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverFetchError).toBeVisible();
    await expect(libraryPage.addBookModal.coverFetchError).toContainText('Could not reach Open Library');
  });

  // -------------------------------------------------------------------------
  // Error dismissal
  // -------------------------------------------------------------------------

  test('cover fetch error clears when cover URL input is edited @regression', async ({
    libraryPage,
    page,
  }) => {
    await page.route(OPEN_LIBRARY_SEARCH, route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ docs: [] }),
      }),
    );

    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await libraryPage.addBookModal.titleInput.fill('Unknown Book');
    await libraryPage.addBookModal.findCoverButton.click();

    await expect(libraryPage.addBookModal.coverFetchError).toBeVisible();

    await libraryPage.addBookModal.coverUrlInput.fill('https://example.com/cover.jpg');

    await expect(libraryPage.addBookModal.coverFetchError).not.toBeVisible();
  });
});
