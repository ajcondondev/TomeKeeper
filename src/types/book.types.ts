// Using const object + type union instead of enum
// (required by tsconfig's erasableSyntaxOnly: true)
export const BookStatus = {
  Unread: 'unread',
  Read: 'read',
  WantToRead: 'want-to-read',
} as const

export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus]

export interface Book {
  id: string
  title: string
  author: string
  coverUrl: string | null
  genre: string | null
  pageCount: number | null
  status: BookStatus
  addedAt: string      // ISO 8601 date string
  finishedAt: string | null  // ISO 8601 or null
}

export interface NewBookInput {
  title: string
  author: string
  coverUrl?: string
  genre?: string
  pageCount?: number
}
