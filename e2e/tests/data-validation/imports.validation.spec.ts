import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { test, expect } from '@playwright/test';

/**
 * Data-validation coverage for the import pipeline.
 *
 * Opens the operational SQLite database read-only and confirms each intended QA
 * validation fixture is present. Requires `npm run db:seed` to have populated
 * the demo accounts.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/tomekeeper.db');
// Imports started before this cutoff are treated as stale for fixture purposes.
const STALE_CUTOFF = '2026-02-01T00:00:00.000Z';

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

test.describe('Import Pipeline — Data Validation', { tag: '@regression' }, () => {
  test('a count-mismatch import exists (total_rows <> accepted_rows + rejected_rows)', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM imports WHERE total_rows <> accepted_rows + rejected_rows`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('rejected rows exist with an error message and no linked book', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM import_rows
           WHERE status = 'rejected' AND error_message IS NOT NULL AND book_id IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('every accepted row links to an existing imported book', () => {
    const { acceptedWithoutBook, acceptedNotImportSource } = withDb(db => ({
      acceptedWithoutBook: (
        db
          .prepare(`SELECT COUNT(*) AS n FROM import_rows WHERE status = 'accepted' AND book_id IS NULL`)
          .get() as CountRow
      ).n,
      acceptedNotImportSource: (
        db
          .prepare(
            `SELECT COUNT(*) AS n FROM import_rows r
             JOIN books b ON r.book_id = b.id
             WHERE r.status = 'accepted' AND b.source <> 'import'`,
          )
          .get() as CountRow
      ).n,
    }));

    expect(acceptedWithoutBook).toBe(0);
    expect(acceptedNotImportSource).toBe(0);
  });

  test('a completed-with-errors import has rejected rows', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM imports WHERE status = 'completed_with_errors' AND rejected_rows > 0`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('a stale processing import exists (unfinished and started before the cutoff)', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM imports
           WHERE status = 'processing' AND finished_at IS NULL AND started_at < ?`,
        )
        .get(STALE_CUTOFF) as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('a duplicate external_ref is shared across imported books', () => {
    const groups = withDb(db =>
      db
        .prepare(
          `SELECT external_ref, COUNT(*) AS n FROM books
           WHERE source = 'import' AND external_ref IS NOT NULL
           GROUP BY external_ref HAVING COUNT(*) > 1`,
        )
        .all() as Array<{ external_ref: string; n: number }>,
    );

    expect(groups.length).toBeGreaterThanOrEqual(1);
  });
});
