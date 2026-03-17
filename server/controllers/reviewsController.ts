import type { Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { reviews, books } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

type IdParam = { id: string }

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export async function getReviews(req: Request, res: Response): Promise<void> {
  const rows = db
    .select({
      id: reviews.id,
      bookId: reviews.bookId,
      title: reviews.title,
      review: reviews.review,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(reviews)
    .leftJoin(books, eq(reviews.bookId, books.id))
    .where(eq(reviews.userId, req.user!.id))
    .all()
  ok(res, rows, 'Reviews retrieved')
}

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { bookId, title, review } = req.body as Record<string, unknown>

  const validationErrors: string[] = []
  if (!bookId || typeof bookId !== 'string' || !bookId.trim()) {
    validationErrors.push('bookId is required')
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    validationErrors.push('title is required')
  }
  if (!review || typeof review !== 'string' || !review.trim()) {
    validationErrors.push('review is required')
  }
  if (validationErrors.length > 0) {
    return next(new AppError(400, 'Validation failed', validationErrors))
  }

  const book = db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId as string), eq(books.userId, req.user!.id)))
    .get()
  if (!book) return next(new AppError(404, 'Book not found'))

  const now = new Date().toISOString()
  const newReview = {
    id: crypto.randomUUID(),
    userId: req.user!.id,
    bookId: bookId as string,
    title: (title as string).trim(),
    review: (review as string).trim(),
    createdAt: now,
    updatedAt: now,
  }

  db.insert(reviews).values(newReview).run()

  ok(
    res,
    {
      ...newReview,
      bookTitle: book.title,
      bookAuthor: book.author,
    },
    'Review created',
    201,
  )
}

export async function updateReview(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params
  const existing = db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.userId, req.user!.id)))
    .get()
  if (!existing) return next(new AppError(404, `Review not found: ${id}`))

  const { title, review } = req.body as Record<string, unknown>

  const updates: { title?: string; review?: string; updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  }
  if (typeof title === 'string' && title.trim()) updates.title = title.trim()
  if (typeof review === 'string' && review.trim()) updates.review = review.trim()

  db.update(reviews)
    .set(updates)
    .where(and(eq(reviews.id, id), eq(reviews.userId, req.user!.id)))
    .run()

  const updated = db
    .select({
      id: reviews.id,
      bookId: reviews.bookId,
      title: reviews.title,
      review: reviews.review,
      createdAt: reviews.createdAt,
      updatedAt: reviews.updatedAt,
      bookTitle: books.title,
      bookAuthor: books.author,
    })
    .from(reviews)
    .leftJoin(books, eq(reviews.bookId, books.id))
    .where(eq(reviews.id, id))
    .get()

  ok(res, updated, 'Review updated')
}

export async function deleteReview(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { id } = req.params
  const existing = db
    .select()
    .from(reviews)
    .where(and(eq(reviews.id, id), eq(reviews.userId, req.user!.id)))
    .get()
  if (!existing) return next(new AppError(404, `Review not found: ${id}`))

  db.delete(reviews).where(eq(reviews.id, id)).run()
  res.status(204).send()
}
