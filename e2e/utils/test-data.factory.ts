import { faker } from '@faker-js/faker';

export interface UserData {
  email: string;
  password: string;
}

export interface BookData {
  title: string;
  author: string;
  genre?: string;
  pageCount?: number;
  coverUrl?: string;
}

export interface ReviewData {
  /** Set after the book has been created via API — required by the API. */
  bookId: string;
  title: string;
  review: string;
}

/**
 * Generates realistic but randomized test data.
 *
 * Always use this factory to build test payloads — do not hardcode strings in specs.
 * Unique emails and titles prevent tests from colliding when run in parallel.
 */
export class TestDataFactory {
  /** Unique email address safe for test use. */
  static email(prefix = 'test'): string {
    return `${prefix}+${faker.string.alphanumeric(8)}@tomekeeper.dev`;
  }

  static password(): string {
    return 'SecurePass123!';
  }

  static user(overrides: Partial<UserData> = {}): UserData {
    return {
      email: TestDataFactory.email(),
      password: TestDataFactory.password(),
      ...overrides,
    };
  }

  static book(overrides: Partial<Omit<BookData, 'pageCount'>> & { pageCount?: number } = {}): BookData {
    return {
      title: faker.helpers.arrayElement([
        `${faker.word.adjective()} ${faker.word.noun()}`,
        faker.lorem.words({ min: 2, max: 4 }),
      ]),
      author: faker.person.fullName(),
      genre: faker.helpers.arrayElement([
        'Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 'Biography', 'History',
      ]),
      pageCount: faker.number.int({ min: 100, max: 900 }),
      ...overrides,
    };
  }

  /** Produces a review payload. `bookId` must be supplied from an already-created book. */
  static review(bookId: string, overrides: Partial<Omit<ReviewData, 'bookId'>> = {}): ReviewData {
    return {
      bookId,
      title: faker.lorem.sentence({ min: 3, max: 8 }).replace(/\.$/, ''),
      review: faker.lorem.paragraphs({ min: 1, max: 3 }),
      ...overrides,
    };
  }

  /**
   * Builds the book-option string that the AddReviewModal combobox uses:
   * "Book Title — Author"
   */
  static reviewBookOption(title: string, author: string): string {
    return `${title} — ${author}`;
  }
}
