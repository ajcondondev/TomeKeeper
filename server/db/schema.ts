import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
})

export type UserRow = typeof users.$inferSelect
export type NewUserRow = typeof users.$inferInsert

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  author: text('author').notNull(),
  coverUrl: text('cover_url'),
  genre: text('genre'),
  pageCount: integer('page_count'),
  status: text('status', { enum: ['unread', 'read', 'want-to-read'] })
    .notNull()
    .default('unread'),
  addedAt: text('added_at').notNull(),
  finishedAt: text('finished_at'),
  externalRef: text('external_ref'),
  source: text('source', { enum: ['manual', 'import', 'api'] })
    .notNull()
    .default('manual'),
  updatedAt: text('updated_at'),
  archivedAt: text('archived_at'),
  validationStatus: text('validation_status', { enum: ['valid', 'pending', 'failed'] })
    .notNull()
    .default('valid'),
})

export type BookRow = typeof books.$inferSelect
export type NewBookRow = typeof books.$inferInsert

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookId: text('book_id').notNull().references(() => books.id),
  title: text('title').notNull(),
  review: text('review').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  rating: integer('rating'),
  status: text('status', { enum: ['published', 'flagged', 'removed'] })
    .notNull()
    .default('published'),
})

export type ReviewRow = typeof reviews.$inferSelect
export type NewReviewRow = typeof reviews.$inferInsert

export const readingSessions = sqliteTable('reading_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  bookId: text('book_id').notNull().references(() => books.id),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  pagesRead: integer('pages_read'),
  createdAt: text('created_at').notNull(),
})

export type ReadingSessionRow = typeof readingSessions.$inferSelect
export type NewReadingSessionRow = typeof readingSessions.$inferInsert

export const imports = sqliteTable('imports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  source: text('source', { enum: ['csv', 'open-library', 'manual'] })
    .notNull()
    .default('csv'),
  filename: text('filename'),
  status: text('status', {
    enum: ['pending', 'processing', 'completed', 'failed', 'completed_with_errors'],
  })
    .notNull()
    .default('pending'),
  totalRows: integer('total_rows').notNull().default(0),
  acceptedRows: integer('accepted_rows').notNull().default(0),
  rejectedRows: integer('rejected_rows').notNull().default(0),
  startedAt: text('started_at'),
  finishedAt: text('finished_at'),
  createdAt: text('created_at').notNull(),
})

export type ImportRow = typeof imports.$inferSelect
export type NewImportRow = typeof imports.$inferInsert

export const importRows = sqliteTable('import_rows', {
  id: text('id').primaryKey(),
  importId: text('import_id').notNull().references(() => imports.id),
  rowNumber: integer('row_number').notNull(),
  rawPayload: text('raw_payload'),
  status: text('status', { enum: ['accepted', 'rejected', 'skipped'] })
    .notNull()
    .default('accepted'),
  errorMessage: text('error_message'),
  bookId: text('book_id').references(() => books.id),
  externalRef: text('external_ref'),
  createdAt: text('created_at').notNull(),
})

export type ImportRowRow = typeof importRows.$inferSelect
export type NewImportRowRow = typeof importRows.$inferInsert
