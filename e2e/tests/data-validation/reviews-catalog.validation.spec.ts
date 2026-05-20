import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { test, expect } from '@playwright/test';

/**
 * Data-validation coverage for catalog provenance and review moderation fixtures.
 *
 * Opens the operational SQLite database read-only and confirms each intended QA
 * validation fixture is present. Requires `npm run db:seed` to have populated
 * the demo accounts.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/tomekeeper.db');
const DUPLICATE_EXTERNAL_REF = 'OL27479W';

function withDb<T>(fn: (db: Database.Database) => T): T {
  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    return fn(db);
  } finally {
    db.close();
  }
}

interface CountRow {
  n: number;
}

test.describe('Catalog & Reviews — Data Validation', { tag: '@regression' }, () => {
  test('a duplicate external_ref is shared by more than one book', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM books WHERE external_ref = ?`,
        )
        .get(DUPLICATE_EXTERNAL_REF) as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(2);
  });

  test('at least one book is marked read but has no finished_at', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM books WHERE status = 'read' AND finished_at IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('at least one review is attached to an unread book', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM reviews r
           JOIN books b ON r.book_id = b.id
           WHERE b.status = 'unread'`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('at least one book has no reviews', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM books b
           LEFT JOIN reviews r ON r.book_id = b.id
           WHERE r.id IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('flagged and removed reviews both exist', () => {
    const { flagged, removed } = withDb(db => ({
      flagged: (db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE status = 'flagged'`).get() as CountRow).n,
      removed: (db.prepare(`SELECT COUNT(*) AS n FROM reviews WHERE status = 'removed'`).get() as CountRow).n,
    }));

    expect(flagged).toBeGreaterThanOrEqual(1);
    expect(removed).toBeGreaterThanOrEqual(1);
  });

  test('at least one review carries an out-of-range rating', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM reviews WHERE rating IS NOT NULL AND (rating < 1 OR rating > 5)`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });
});
