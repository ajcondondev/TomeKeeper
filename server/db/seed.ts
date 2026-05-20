/**
 * Deterministic QA fixtures / operational demo data.
 *
 * Seeds a single namespaced demo account with reading-session fixtures used by
 * API contract and data-validation coverage. Data is fixed (stable ids and
 * timestamps) and idempotent — re-running inserts nothing new.
 *
 * The namespaced account is isolated from E2E test users so seeding never
 * collides with the Playwright suite.
 *
 *   npm run db:seed
 */
import bcrypt from 'bcryptjs'
import { db, runMigrations } from './client.js'
import { users, books, reviews, readingSessions, imports, importRows } from './schema.js'

export const SEED_USER = {
  id: 'seed-user-reading',
  email: 'scenario+reading@tomekeeper.dev',
  password: 'SecurePass123!',
}

export const CATALOG_USER = {
  id: 'seed-user-catalog',
  email: 'scenario+catalog@tomekeeper.dev',
  password: 'SecurePass123!',
}

export const IMPORTS_USER = {
  id: 'seed-user-imports',
  email: 'scenario+imports@tomekeeper.dev',
  password: 'SecurePass123!',
}

/** Fixture whose pages_read intentionally exceeds the book's page_count. */
export const OVER_COUNT_SESSION_ID = 'seed-session-over-count'

/** external_ref shared by two catalog books — a deliberate duplicate-provenance fixture. */
export const DUPLICATE_EXTERNAL_REF = 'OL27479W'

/** Import batch that intentionally fails count reconciliation. */
export const COUNT_MISMATCH_IMPORT_ID = 'seed-import-count-mismatch'

/** Import batch completed with row-level errors — used by API contract coverage. */
export const COMPLETED_WITH_ERRORS_IMPORT_ID = 'seed-import-with-errors'

/** external_ref shared by two import-created books — a duplicate-provenance fixture. */
export const DUPLICATE_IMPORT_EXTERNAL_REF = 'OL55555W'

export async function seed(): Promise<void> {
  runMigrations()

  const passwordHash = await bcrypt.hash(SEED_USER.password, 12)
  db.insert(users)
    .values({
      id: SEED_USER.id,
      email: SEED_USER.email,
      passwordHash,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    .onConflictDoNothing()
    .run()

  db.insert(books)
    .values([
      {
        id: 'seed-book-dune',
        userId: SEED_USER.id,
        title: 'Dune',
        author: 'Frank Herbert',
        coverUrl: null,
        genre: 'Science Fiction',
        pageCount: 320,
        status: 'read',
        addedAt: '2026-01-02T00:00:00.000Z',
        finishedAt: '2026-02-01T00:00:00.000Z',
      },
      {
        id: 'seed-book-hobbit',
        userId: SEED_USER.id,
        title: 'The Hobbit',
        author: 'J.R.R. Tolkien',
        coverUrl: null,
        genre: 'Fantasy',
        pageCount: 300,
        status: 'unread',
        addedAt: '2026-01-03T00:00:00.000Z',
        finishedAt: null,
      },
    ])
    .onConflictDoNothing()
    .run()

  db.insert(readingSessions)
    .values([
      {
        id: 'seed-session-1',
        userId: SEED_USER.id,
        bookId: 'seed-book-dune',
        startedAt: '2026-01-10T18:00:00.000Z',
        endedAt: '2026-01-10T19:30:00.000Z',
        pagesRead: 45,
        createdAt: '2026-01-10T19:30:00.000Z',
      },
      {
        id: 'seed-session-2',
        userId: SEED_USER.id,
        bookId: 'seed-book-dune',
        startedAt: '2026-01-11T18:00:00.000Z',
        endedAt: '2026-01-11T19:00:00.000Z',
        pagesRead: 30,
        createdAt: '2026-01-11T19:00:00.000Z',
      },
      // In-progress: ended_at is null.
      {
        id: 'seed-session-in-progress',
        userId: SEED_USER.id,
        bookId: 'seed-book-hobbit',
        startedAt: '2026-01-12T20:00:00.000Z',
        endedAt: null,
        pagesRead: 15,
        createdAt: '2026-01-12T20:00:00.000Z',
      },
      // QA edge case: pages_read (999) exceeds book page_count (320).
      {
        id: OVER_COUNT_SESSION_ID,
        userId: SEED_USER.id,
        bookId: 'seed-book-dune',
        startedAt: '2026-01-13T08:00:00.000Z',
        endedAt: '2026-01-13T12:00:00.000Z',
        pagesRead: 999,
        createdAt: '2026-01-13T12:00:00.000Z',
      },
    ])
    .onConflictDoNothing()
    .run()

  // ---------------------------------------------------------------------------
  // Catalog & review fixtures — catalog provenance, review moderation, and QA
  // validation fixtures (duplicate provenance, status/timestamp mismatches, etc.)
  // ---------------------------------------------------------------------------
  const catalogHash = await bcrypt.hash(CATALOG_USER.password, 12)
  db.insert(users)
    .values({
      id: CATALOG_USER.id,
      email: CATALOG_USER.email,
      passwordHash: catalogHash,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    .onConflictDoNothing()
    .run()

  db.insert(books)
    .values([
      // Two books sharing one external_ref — duplicate catalog provenance.
      {
        id: 'seed-cat-book-dup-a',
        userId: CATALOG_USER.id,
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        coverUrl: null,
        genre: 'Fantasy',
        pageCount: 1178,
        status: 'read',
        addedAt: '2026-01-05T00:00:00.000Z',
        finishedAt: '2026-03-01T00:00:00.000Z',
        externalRef: DUPLICATE_EXTERNAL_REF,
        source: 'import',
        updatedAt: '2026-03-01T00:00:00.000Z',
        archivedAt: null,
        validationStatus: 'valid',
      },
      {
        id: 'seed-cat-book-dup-b',
        userId: CATALOG_USER.id,
        title: 'The Lord of the Rings (Illustrated Edition)',
        author: 'J.R.R. Tolkien',
        coverUrl: null,
        genre: 'Fantasy',
        pageCount: 1200,
        status: 'unread',
        addedAt: '2026-01-06T00:00:00.000Z',
        finishedAt: null,
        externalRef: DUPLICATE_EXTERNAL_REF,
        source: 'import',
        updatedAt: null,
        archivedAt: null,
        validationStatus: 'pending',
      },
      // Marked read but missing finished_at — a status/timestamp mismatch.
      {
        id: 'seed-cat-book-read-no-finish',
        userId: CATALOG_USER.id,
        title: '1984',
        author: 'George Orwell',
        coverUrl: null,
        genre: 'Fiction',
        pageCount: 328,
        status: 'read',
        addedAt: '2026-01-07T00:00:00.000Z',
        finishedAt: null,
        externalRef: 'OL1168083W',
        source: 'manual',
        updatedAt: null,
        archivedAt: null,
        validationStatus: 'valid',
      },
      // Unread but carries a review (see reviews below) — cross-entity mismatch.
      {
        id: 'seed-cat-book-unread-reviewed',
        userId: CATALOG_USER.id,
        title: 'Brave New World',
        author: 'Aldous Huxley',
        coverUrl: null,
        genre: 'Fiction',
        pageCount: 311,
        status: 'unread',
        addedAt: '2026-01-08T00:00:00.000Z',
        finishedAt: null,
        externalRef: 'OL64468W',
        source: 'manual',
        updatedAt: null,
        archivedAt: null,
        validationStatus: 'valid',
      },
      // No reviews attached — a book-with-no-reviews fixture.
      {
        id: 'seed-cat-book-no-reviews',
        userId: CATALOG_USER.id,
        title: 'Fahrenheit 451',
        author: 'Ray Bradbury',
        coverUrl: null,
        genre: 'Fiction',
        pageCount: 256,
        status: 'want-to-read',
        addedAt: '2026-01-09T00:00:00.000Z',
        finishedAt: null,
        externalRef: null,
        source: 'manual',
        updatedAt: null,
        archivedAt: null,
        validationStatus: 'valid',
      },
      // Archived import with a failed validation status.
      {
        id: 'seed-cat-book-archived',
        userId: CATALOG_USER.id,
        title: 'Legacy Catalog Entry',
        author: 'Bulk Import',
        coverUrl: null,
        genre: null,
        pageCount: null,
        status: 'unread',
        addedAt: '2026-01-04T00:00:00.000Z',
        finishedAt: null,
        externalRef: 'OL00000W',
        source: 'import',
        updatedAt: '2026-04-01T00:00:00.000Z',
        archivedAt: '2026-04-01T00:00:00.000Z',
        validationStatus: 'failed',
      },
    ])
    .onConflictDoNothing()
    .run()

  db.insert(reviews)
    .values([
      // Review attached to an unread book.
      {
        id: 'seed-cat-review-on-unread',
        userId: CATALOG_USER.id,
        bookId: 'seed-cat-book-unread-reviewed',
        title: 'Read it before I shelved it',
        review: 'Notes captured before the book was marked unread again.',
        createdAt: '2026-02-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        rating: 5,
        status: 'published',
      },
      // Flagged review.
      {
        id: 'seed-cat-review-flagged',
        userId: CATALOG_USER.id,
        bookId: 'seed-cat-book-dup-a',
        title: 'Reported for review',
        review: 'Flagged by moderation for follow-up.',
        createdAt: '2026-02-02T00:00:00.000Z',
        updatedAt: '2026-02-02T00:00:00.000Z',
        rating: 2,
        status: 'flagged',
      },
      // Removed review.
      {
        id: 'seed-cat-review-removed',
        userId: CATALOG_USER.id,
        bookId: 'seed-cat-book-dup-a',
        title: 'Taken down',
        review: 'Removed by moderation.',
        createdAt: '2026-02-03T00:00:00.000Z',
        updatedAt: '2026-02-03T00:00:00.000Z',
        rating: 1,
        status: 'removed',
      },
      // Out-of-range rating (7) — a suspicious-value validation fixture.
      {
        id: 'seed-cat-review-bad-rating',
        userId: CATALOG_USER.id,
        bookId: 'seed-cat-book-read-no-finish',
        title: 'Off-the-scale',
        review: 'Rating value outside the supported 1-5 range.',
        createdAt: '2026-02-04T00:00:00.000Z',
        updatedAt: '2026-02-04T00:00:00.000Z',
        rating: 7,
        status: 'published',
      },
      // A normal, in-range published review.
      {
        id: 'seed-cat-review-normal',
        userId: CATALOG_USER.id,
        bookId: 'seed-cat-book-read-no-finish',
        title: 'Holds up',
        review: 'A well-formed published review with an in-range rating.',
        createdAt: '2026-02-05T00:00:00.000Z',
        updatedAt: '2026-02-05T00:00:00.000Z',
        rating: 4,
        status: 'published',
      },
    ])
    .onConflictDoNothing()
    .run()

  // ---------------------------------------------------------------------------
  // Import pipeline fixtures — catalog import validation, import audit trail, and
  // row-level import diagnostics (count reconciliation, rejected rows, stale
  // batches, duplicate provenance).
  // ---------------------------------------------------------------------------
  const importsHash = await bcrypt.hash(IMPORTS_USER.password, 12)
  db.insert(users)
    .values({
      id: IMPORTS_USER.id,
      email: IMPORTS_USER.email,
      passwordHash: importsHash,
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    .onConflictDoNothing()
    .run()

  // Books created through import batches (source = 'import').
  const importedBook = (
    id: string,
    title: string,
    author: string,
    externalRef: string,
    pageCount: number,
    validationStatus: 'valid' | 'pending' | 'failed',
  ) => ({
    id,
    userId: IMPORTS_USER.id,
    title,
    author,
    coverUrl: null,
    genre: 'Science Fiction',
    pageCount,
    status: 'unread' as const,
    addedAt: '2026-02-10T09:01:00.000Z',
    finishedAt: null,
    externalRef,
    source: 'import' as const,
    updatedAt: '2026-02-10T09:01:00.000Z',
    archivedAt: null,
    validationStatus,
  })

  db.insert(books)
    .values([
      importedBook('seed-imp-book-1', 'The Name of the Wind', 'Patrick Rothfuss', 'OL10001W', 662, 'valid'),
      importedBook('seed-imp-book-2', 'Mistborn', 'Brandon Sanderson', 'OL10002W', 541, 'valid'),
      importedBook('seed-imp-book-3', 'The Way of Kings', 'Brandon Sanderson', 'OL10003W', 1007, 'valid'),
      // Duplicate import provenance — two books share one external_ref.
      importedBook('seed-imp-book-dup-a', 'Neuromancer', 'William Gibson', DUPLICATE_IMPORT_EXTERNAL_REF, 271, 'pending'),
      importedBook('seed-imp-book-dup-b', 'Neuromancer (Reissue)', 'William Gibson', DUPLICATE_IMPORT_EXTERNAL_REF, 280, 'pending'),
      importedBook('seed-imp-book-cm-1', 'Hyperion', 'Dan Simmons', 'OL10006W', 482, 'valid'),
      importedBook('seed-imp-book-cm-2', 'Dune Messiah', 'Frank Herbert', 'OL10007W', 256, 'valid'),
    ])
    .onConflictDoNothing()
    .run()

  db.insert(imports)
    .values([
      // 1. Successful import — counts reconcile (3 = 3 + 0).
      {
        id: 'seed-import-success',
        userId: IMPORTS_USER.id,
        source: 'csv',
        filename: 'goodreads-export.csv',
        status: 'completed',
        totalRows: 3,
        acceptedRows: 3,
        rejectedRows: 0,
        startedAt: '2026-02-10T09:00:00.000Z',
        finishedAt: '2026-02-10T09:01:00.000Z',
        createdAt: '2026-02-10T09:00:00.000Z',
      },
      // 2. Completed with row-level errors — counts reconcile (4 = 2 + 2).
      {
        id: COMPLETED_WITH_ERRORS_IMPORT_ID,
        userId: IMPORTS_USER.id,
        source: 'csv',
        filename: 'partial-list.csv',
        status: 'completed_with_errors',
        totalRows: 4,
        acceptedRows: 2,
        rejectedRows: 2,
        startedAt: '2026-02-11T09:00:00.000Z',
        finishedAt: '2026-02-11T09:02:00.000Z',
        createdAt: '2026-02-11T09:00:00.000Z',
      },
      // 3. Count mismatch — total_rows (10) != accepted (2) + rejected (1).
      {
        id: COUNT_MISMATCH_IMPORT_ID,
        userId: IMPORTS_USER.id,
        source: 'csv',
        filename: 'large-batch.csv',
        status: 'completed',
        totalRows: 10,
        acceptedRows: 2,
        rejectedRows: 1,
        startedAt: '2026-02-12T09:00:00.000Z',
        finishedAt: '2026-02-12T09:05:00.000Z',
        createdAt: '2026-02-12T09:00:00.000Z',
      },
      // 4. Failed import — rejected rows grouped under one error message.
      {
        id: 'seed-import-failed',
        userId: IMPORTS_USER.id,
        source: 'open-library',
        filename: null,
        status: 'failed',
        totalRows: 2,
        acceptedRows: 0,
        rejectedRows: 2,
        startedAt: '2026-02-13T09:00:00.000Z',
        finishedAt: '2026-02-13T09:00:30.000Z',
        createdAt: '2026-02-13T09:00:00.000Z',
      },
      // 5. Stale processing import — started long ago, never finished.
      {
        id: 'seed-import-processing',
        userId: IMPORTS_USER.id,
        source: 'csv',
        filename: 'stuck-upload.csv',
        status: 'processing',
        totalRows: 5,
        acceptedRows: 0,
        rejectedRows: 0,
        startedAt: '2026-01-01T00:00:00.000Z',
        finishedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    .onConflictDoNothing()
    .run()

  const acceptedRow = (
    id: string,
    importId: string,
    rowNumber: number,
    bookId: string,
    externalRef: string,
    createdAt: string,
  ) => ({
    id,
    importId,
    rowNumber,
    rawPayload: JSON.stringify({ title: 'see book', externalRef }),
    status: 'accepted' as const,
    errorMessage: null,
    bookId,
    externalRef,
    createdAt,
  })

  const rejectedRow = (
    id: string,
    importId: string,
    rowNumber: number,
    errorMessage: string,
    externalRef: string | null,
    createdAt: string,
  ) => ({
    id,
    importId,
    rowNumber,
    rawPayload: JSON.stringify({ row: rowNumber, error: errorMessage }),
    status: 'rejected' as const,
    errorMessage,
    bookId: null,
    externalRef,
    createdAt,
  })

  db.insert(importRows)
    .values([
      // Successful import — 3 accepted rows linked to created books.
      acceptedRow('seed-row-s1', 'seed-import-success', 1, 'seed-imp-book-1', 'OL10001W', '2026-02-10T09:00:10.000Z'),
      acceptedRow('seed-row-s2', 'seed-import-success', 2, 'seed-imp-book-2', 'OL10002W', '2026-02-10T09:00:20.000Z'),
      acceptedRow('seed-row-s3', 'seed-import-success', 3, 'seed-imp-book-3', 'OL10003W', '2026-02-10T09:00:30.000Z'),
      // Completed-with-errors — 2 accepted (duplicate ref) + 2 rejected.
      acceptedRow('seed-row-e1', COMPLETED_WITH_ERRORS_IMPORT_ID, 1, 'seed-imp-book-dup-a', DUPLICATE_IMPORT_EXTERNAL_REF, '2026-02-11T09:00:10.000Z'),
      acceptedRow('seed-row-e2', COMPLETED_WITH_ERRORS_IMPORT_ID, 2, 'seed-imp-book-dup-b', DUPLICATE_IMPORT_EXTERNAL_REF, '2026-02-11T09:00:20.000Z'),
      rejectedRow('seed-row-e3', COMPLETED_WITH_ERRORS_IMPORT_ID, 3, 'Missing title', null, '2026-02-11T09:00:30.000Z'),
      rejectedRow('seed-row-e4', COMPLETED_WITH_ERRORS_IMPORT_ID, 4, 'Invalid page count', 'OL99999W', '2026-02-11T09:00:40.000Z'),
      // Count-mismatch — 2 accepted + 1 rejected actually present.
      acceptedRow('seed-row-cm1', COUNT_MISMATCH_IMPORT_ID, 1, 'seed-imp-book-cm-1', 'OL10006W', '2026-02-12T09:00:10.000Z'),
      acceptedRow('seed-row-cm2', COUNT_MISMATCH_IMPORT_ID, 2, 'seed-imp-book-cm-2', 'OL10007W', '2026-02-12T09:00:20.000Z'),
      rejectedRow('seed-row-cm3', COUNT_MISMATCH_IMPORT_ID, 3, 'Unsupported status', null, '2026-02-12T09:00:30.000Z'),
      // Failed import — both rows rejected under one grouped error message.
      rejectedRow('seed-row-f1', 'seed-import-failed', 1, 'Malformed row payload', null, '2026-02-13T09:00:10.000Z'),
      rejectedRow('seed-row-f2', 'seed-import-failed', 2, 'Malformed row payload', null, '2026-02-13T09:00:20.000Z'),
      // Stale processing import — one row skipped, no book produced.
      {
        id: 'seed-row-p1',
        importId: 'seed-import-processing',
        rowNumber: 1,
        rawPayload: JSON.stringify({ title: 'pending row' }),
        status: 'skipped' as const,
        errorMessage: null,
        bookId: null,
        externalRef: null,
        createdAt: '2026-01-01T00:00:10.000Z',
      },
    ])
    .onConflictDoNothing()
    .run()

  const sessionCount = db.select().from(readingSessions).all().length
  const bookCount = db.select().from(books).all().length
  const reviewCount = db.select().from(reviews).all().length
  const importCount = db.select().from(imports).all().length
  const importRowCount = db.select().from(importRows).all().length
  console.log(
    `Seeded ${SEED_USER.email} (reading), ${CATALOG_USER.email} (catalog & reviews), ` +
      `and ${IMPORTS_USER.email} (imports). Totals — books: ${bookCount}, reviews: ${reviewCount}, ` +
      `reading_sessions: ${sessionCount}, imports: ${importCount}, import_rows: ${importRowCount}.`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
