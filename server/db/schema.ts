import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const books = sqliteTable('books', {
  id: text('id').primaryKey(),
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
})

export type BookRow = typeof books.$inferSelect
export type NewBookRow = typeof books.$inferInsert
