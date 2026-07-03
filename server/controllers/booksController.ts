import type { Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { books } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'
import type { CreateBookInput, UpdateBookInput } from '../validation/index.js'

type IdParam = { id: string }

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export async function getBooks(req: Request, res: Response): Promise<void> {
  const rows = db.select().from(books).where(eq(books.userId, req.user!.id)).all()
  ok(res, rows, 'Books retrieved')
}

export async function getBook(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const row = db
    .select()
    .from(books)
    .where(and(eq(books.id, req.params.id), eq(books.userId, req.user!.id)))
    .get()
  if (!row) return next(new AppError(404, `Book not found: ${req.params.id}`))
  ok(res, row, 'Book retrieved')
}

export async function createBook(req: Request, res: Response): Promise<void> {
  // Validated and trimmed by createBookSchema
  const { title, author, coverUrl, genre, pageCount } = req.body as CreateBookInput

  const newBook = {
    id: crypto.randomUUID(),
    userId: req.user!.id,
    title,
    author,
    coverUrl: coverUrl || null,
    genre: genre || null,
    pageCount: pageCount ?? null,
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
  const existing = db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, req.user!.id)))
    .get()
  if (!existing) return next(new AppError(404, `Book not found: ${id}`))

  // Validated and trimmed by updateBookSchema; absent fields are undefined
  const { title, author, coverUrl, genre, pageCount, status, finishedAt } =
    req.body as UpdateBookInput

  const updates: Partial<typeof existing> = {}
  if (title !== undefined) updates.title = title
  if (author !== undefined) updates.author = author
  if (coverUrl !== undefined) updates.coverUrl = coverUrl || null
  if (genre !== undefined) updates.genre = genre || null
  if (pageCount !== undefined) updates.pageCount = pageCount
  if (status !== undefined) updates.status = status
  if (finishedAt !== undefined) updates.finishedAt = finishedAt

  db.update(books).set(updates).where(and(eq(books.id, id), eq(books.userId, req.user!.id))).run()
  const updated = db.select().from(books).where(eq(books.id, id)).get()
  ok(res, updated, 'Book updated')
}

export async function deleteBook(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params
  const existing = db
    .select()
    .from(books)
    .where(and(eq(books.id, id), eq(books.userId, req.user!.id)))
    .get()
  if (!existing) return next(new AppError(404, `Book not found: ${id}`))

  db.delete(books).where(eq(books.id, id)).run()
  res.status(204).send()
}
