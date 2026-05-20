import type { Request, Response } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { readingSessions, books } from '../db/schema.js'

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export async function getReadingSessions(req: Request, res: Response): Promise<void> {
  const rows = db
    .select({
      id: readingSessions.id,
      bookId: readingSessions.bookId,
      startedAt: readingSessions.startedAt,
      endedAt: readingSessions.endedAt,
      pagesRead: readingSessions.pagesRead,
      createdAt: readingSessions.createdAt,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(readingSessions)
    .leftJoin(books, eq(readingSessions.bookId, books.id))
    .where(eq(readingSessions.userId, req.user!.id))
    .all()
  ok(res, rows, 'Reading sessions retrieved')
}
