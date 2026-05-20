import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { test, expect } from '@playwright/test';

/**
 * Data-validation coverage for the support workflow.
 *
 * Opens the operational SQLite database read-only and confirms each intended QA
 * validation fixture is present. Requires `npm run db:seed` to have populated
 * the demo accounts.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.resolve(__dirname, '../../../data/tomekeeper.db');

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

test.describe('Support Workflow — Data Validation', { tag: '@regression' }, () => {
  test('tickets with no events exist', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM support_tickets t
           LEFT JOIN ticket_events e ON e.ticket_id = t.id
           WHERE e.id IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('closed tickets without a resolution event exist', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM support_tickets t
           WHERE t.status = 'closed'
             AND NOT EXISTS (
               SELECT 1 FROM ticket_events e
               WHERE e.ticket_id = t.id AND e.event_type = 'resolution'
             )`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('resolved tickets missing resolved_at exist', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM support_tickets WHERE status = 'resolved' AND resolved_at IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('high or urgent priority tickets without follow-up exist', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM support_tickets t
           WHERE t.priority IN ('high', 'urgent')
             AND NOT EXISTS (
               SELECT 1 FROM ticket_events e
               WHERE e.ticket_id = t.id AND e.event_type <> 'created'
             )`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('duplicate issue reports exist (same user, category, subject, open/pending)', () => {
    const groups = withDb(db =>
      db
        .prepare(
          `SELECT user_id, category, subject, COUNT(*) AS n
           FROM support_tickets
           WHERE status IN ('open', 'pending')
           GROUP BY user_id, category, subject
           HAVING COUNT(*) > 1`,
        )
        .all() as Array<{ n: number }>,
    );

    expect(groups.length).toBeGreaterThanOrEqual(1);
  });

  test('an import-linked ticket references a rejected import row', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM support_tickets t
           JOIN import_rows ir ON t.import_row_id = ir.id
           WHERE ir.status = 'rejected' AND ir.error_message IS NOT NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });

  test('a catalog-linked ticket references a read book missing finished_at', () => {
    const row = withDb(db =>
      db
        .prepare(
          `SELECT COUNT(*) AS n
           FROM support_tickets t
           JOIN books b ON t.book_id = b.id
           WHERE b.status = 'read' AND b.finished_at IS NULL`,
        )
        .get() as CountRow,
    );

    expect(row.n).toBeGreaterThanOrEqual(1);
  });
});
