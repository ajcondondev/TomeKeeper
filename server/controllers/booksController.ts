import type { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { books } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

type IdParam = { id: string }

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export async function getBooks(_req: Request, res: Response): Promise<void> {
  const rows = db.select().from(books).all()
  ok(res, rows, 'Books retrieved')
}

export async function getBook(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const row = db.select().from(books).where(eq(books.id, req.params.id)).get()
  if (!row) return next(new AppError(404, `Book not found: ${req.params.id}`))
  ok(res, row, 'Book retrieved')
}

export async function createBook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { title, author, coverUrl, genre, pageCount } = req.body as Record<string, unknown>

  const validationErrors: string[] = []
  if (!title || typeof title !== 'string' || !title.trim()) {
    validationErrors.push('title is required')
  }
  if (!author || typeof author !== 'string' || !author.trim()) {
    validationErrors.push('author is required')
  }
  if (validationErrors.length > 0) {
    return next(new AppError(400, 'Validation failed', validationErrors))
  }

  const newBook = {
    id: crypto.randomUUID(),
    title: (title as string).trim(),
    author: (author as string).trim(),
    coverUrl: typeof coverUrl === 'string' && coverUrl.trim() ? coverUrl.trim() : null,
    genre: typeof genre === 'string' && genre.trim() ? genre.trim() : null,
    pageCount: typeof pageCount === 'number' ? pageCount : null,
    status: 'unread' as const,
    addedAt: new Date().toISOString(),
    finishedAt: null,
  }

  db.insert(books).values(newBook).run()
  ok(res, newBook, 'Book created', 201)
}

export async function updateBook(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params
  const existing = db.select().from(books).where(eq(books.id, id)).get()
  if (!existing) return next(new AppError(404, `Book not found: ${id}`))

  const { title, author, coverUrl, genre, pageCount, status, finishedAt } =
    req.body as Record<string, unknown>

  const updates: Partial<typeof existing> = {}
  if (typeof title === 'string' && title.trim()) updates.title = title.trim()
  if (typeof author === 'string' && author.trim()) updates.author = author.trim()
  if (typeof coverUrl === 'string') updates.coverUrl = coverUrl.trim() || null
  if (typeof genre === 'string') updates.genre = genre.trim() || null
  if (typeof pageCount === 'number') updates.pageCount = pageCount
  if (status === 'unread' || status === 'read' || status === 'want-to-read') {
    updates.status = status
  }
  if (typeof finishedAt === 'string' || finishedAt === null) {
    updates.finishedAt = finishedAt as string | null
  }

  if (Object.keys(updates).length === 0) {
    return next(new AppError(400, 'No valid fields provided for update'))
  }

  db.update(books).set(updates).where(eq(books.id, id)).run()
  const updated = db.select().from(books).where(eq(books.id, id)).get()
  ok(res, updated, 'Book updated')
}

export async function deleteBook(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params
  const existing = db.select().from(books).where(eq(books.id, id)).get()
  if (!existing) return next(new AppError(404, `Book not found: ${id}`))

  db.delete(books).where(eq(books.id, id)).run()
  res.status(204).send()
}
