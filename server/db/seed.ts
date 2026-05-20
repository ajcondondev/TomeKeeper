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
import { users, books, readingSessions } from './schema.js'

export const SEED_USER = {
  id: 'seed-user-reading',
  email: 'scenario+reading@tomekeeper.dev',
  password: 'SecurePass123!',
}

/** Fixture whose pages_read intentionally exceeds the book's page_count. */
export const OVER_COUNT_SESSION_ID = 'seed-session-over-count'

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

  const total = db.select().from(readingSessions).all().length
  console.log(
    `Seeded demo account ${SEED_USER.email}: 2 books, 4 reading sessions ` +
      `(1 in-progress, 1 over-count edge case). reading_sessions rows: ${total}`,
  )
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
