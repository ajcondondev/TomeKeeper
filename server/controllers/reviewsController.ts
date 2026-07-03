import type { Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { reviews, books } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'
import type { CreateReviewInput, UpdateReviewInput } from '../validation/index.js'

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
  // Validated and trimmed by createReviewSchema
  const { bookId, title, review } = req.body as CreateReviewInput

  const book = db
    .select()
    .from(books)
    .where(and(eq(books.id, bookId), eq(books.userId, req.user!.id)))
    .get()
  if (!book) return next(new AppError(404, 'Book not found'))

  const now = new Date().toISOString()
  const newReview = {
    id: crypto.randomUUID(),
    userId: req.user!.id,
    bookId,
    title,
    review,
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

  // Validated and trimmed by updateReviewSchema; absent fields are undefined
  const { title, review } = req.body as UpdateReviewInput

  const updates: { title?: string; review?: string; updatedAt: string } = {
    updatedAt: new Date().toISOString(),
  }
  if (title !== undefined) updates.title = title
  if (review !== undefined) updates.review = review

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
