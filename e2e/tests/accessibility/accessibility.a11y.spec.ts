import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures/base.fixture';
import { TestDataFactory } from '../../utils';

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// ---------------------------------------------------------------------------
// Auth pages — unauthenticated
// ---------------------------------------------------------------------------

test.describe('Accessibility — Auth Pages', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login page has no WCAG violations', { tag: '@smoke' }, async ({ loginPage, page }) => {
    await loginPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('login page inputs have accessible labels', async ({ loginPage, page }) => {
    await loginPage.goto();

    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });

  test('login page error message is accessible', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.submitCredentials('bad@example.com', 'wrongpass1');
    await expect(loginPage.errorAlert).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('registration page has no WCAG violations', async ({ registerPage, page }) => {
    await registerPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('registration page inputs have accessible labels', async ({ registerPage, page }) => {
    await registerPage.goto();

    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
  });

  test('registration validation error is accessible', async ({ registerPage, page }) => {
    await registerPage.goto();
    await registerPage.submitCredentials(TestDataFactory.email(), 'short');
    await expect(registerPage.errorAlert).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Authenticated pages
// ---------------------------------------------------------------------------

test.describe('Accessibility — Authenticated Pages', { tag: '@regression' }, () => {
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

  test('library page (empty) has no WCAG violations', { tag: '@smoke' }, async ({ libraryPage, page }) => {
    await libraryPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('library page (with books) has no WCAG violations', async ({
    libraryPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await libraryPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('reading list page has no WCAG violations', async ({ readingListPage, page }) => {
    await readingListPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('reviews page (empty) has no WCAG violations', async ({ reviewsPage, page }) => {
    await reviewsPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('reviews page (with reviews) has no WCAG violations', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);
    const review = await apiHelper.createReview(TestDataFactory.review(book.id));
    reviewIds.push(review.id);

    await reviewsPage.goto();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Modal accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility — Modals', { tag: '@regression' }, () => {
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

  // ---- Add Book Modal --------------------------------------------------------

  test('Add Book modal has no WCAG violations @critical', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('Add Book modal has role="dialog" with an accessible name', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();
  });

  test('Add Book modal inputs have accessible labels', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    const dialog = page.getByRole('dialog', { name: 'Add a Book' });

    await expect(dialog.getByRole('textbox', { name: 'Title *' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Author *' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Genre' })).toBeVisible();
    await expect(dialog.getByRole('spinbutton', { name: 'Pages' })).toBeVisible();
  });

  test('Add Book modal Escape key closes it @critical', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Add a Book' })).not.toBeVisible();
  });

  test('focus moves into Add Book modal when it opens @critical', async ({ libraryPage, page }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();

    const dialog = page.getByRole('dialog', { name: 'Add a Book' });
    await expect(dialog).toBeVisible();

    // A focusable element inside the modal should have focus.
    await expect(dialog.locator(':focus')).toHaveCount(1);
  });

  test('focus returns to Add Book button after modal closes @critical', async ({
    libraryPage,
    page,
  }) => {
    await libraryPage.goto();
    await libraryPage.addBookButton.click();
    await expect(page.getByRole('dialog', { name: 'Add a Book' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Add a Book' })).not.toBeVisible();

    await expect(libraryPage.addBookButton).toBeFocused();
  });

  // ---- Add Review Modal --------------------------------------------------------

  test('Add Review modal has no WCAG violations @critical', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('Add Review modal has role="dialog" with an accessible name', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toBeVisible();
  });

  test('Add Review modal inputs have accessible labels', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();

    const dialog = page.getByRole('dialog', { name: 'Add a Review' });

    await expect(dialog.getByRole('combobox', { name: 'Book *' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Review Title *' })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Review *' })).toBeVisible();
  });

  test('Add Review modal Escape key closes it @critical', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);

    await reviewsPage.goto();
    await reviewsPage.addReviewButton.click();
    await expect(page.getByRole('dialog', { name: 'Add a Review' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Add a Review' })).not.toBeVisible();
  });

  // ---- Edit Review Modal -------------------------------------------------------

  test('Edit Review modal has no WCAG violations @critical', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);
    const review = await apiHelper.createReview(TestDataFactory.review(book.id));
    reviewIds.push(review.id);

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(review.title).editButton.click();

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    expect(results.violations).toEqual([]);
  });

  test('Edit Review modal has role="dialog" with an accessible name', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);
    const review = await apiHelper.createReview(TestDataFactory.review(book.id));
    reviewIds.push(review.id);

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(review.title).editButton.click();

    await expect(page.getByRole('dialog', { name: 'Edit Review' })).toBeVisible();
  });

  test('Edit Review modal Escape key closes it @critical', async ({
    reviewsPage,
    apiHelper,
    page,
  }) => {
    const book = await apiHelper.createBook(TestDataFactory.book());
    bookIds.push(book.id);
    const review = await apiHelper.createReview(TestDataFactory.review(book.id));
    reviewIds.push(review.id);

    await reviewsPage.goto();
    await reviewsPage.getReviewCard(review.title).editButton.click();
    await expect(page.getByRole('dialog', { name: 'Edit Review' })).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog', { name: 'Edit Review' })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

test.describe('Accessibility — Keyboard Navigation', { tag: '@regression' }, () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('user can submit login form using Tab and Enter @critical', async ({
    loginPage,
    apiHelper,
    page,
  }) => {
    const user = TestDataFactory.user();
    await apiHelper.registerRaw(user.email, user.password);

    await loginPage.goto();
    await page.keyboard.press('Tab');
    await page.keyboard.type(user.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(user.password);
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/library/);
  });
});
