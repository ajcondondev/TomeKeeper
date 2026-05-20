import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { test, expect } from '@playwright/test';

/**
 * Data-validation coverage for reading-session fixtures.
 *
 * Opens the operational SQLite database read-only and confirms the intentional
 * QA edge-case fixture (pages_read greater than the book's page_count) is
 * present. Requires `npm run db:seed` to have populated the demo account.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/tomekeeper.db');
const OVER_COUNT_SESSION_ID = 'seed-session-over-count';

interface OverCountRow {
  id: string;
  pages_read: number;
  page_count: number;
}

test.describe('Reading Sessions — Data Validation', { tag: '@regression' }, () => {
  test('an over-count fixture exists where pages_read exceeds the book page_count', () => {
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });

    const rows = db
      .prepare(
        `SELECT rs.id AS id, rs.pages_read AS pages_read, b.page_count AS page_count
         FROM reading_sessions rs
         JOIN books b ON rs.book_id = b.id
         WHERE rs.pages_read > b.page_count`,
      )
      .all() as OverCountRow[];
    db.close();

    expect(rows.length).toBeGreaterThanOrEqual(1);

    const fixture = rows.find(r => r.id === OVER_COUNT_SESSION_ID);
    expect(fixture, `expected seeded fixture "${OVER_COUNT_SESSION_ID}" — run npm run db:seed`).toBeDefined();
    expect(fixture!.pages_read).toBeGreaterThan(fixture!.page_count);
  });
});
