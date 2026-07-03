import { z } from 'zod'

const title = z
  .string({ required_error: 'title is required', invalid_type_error: 'title must be a string' })
  .trim()
  .min(1, 'title is required')
  .max(200, 'title must be 200 characters or fewer')

const review = z
  .string({ required_error: 'review is required', invalid_type_error: 'review must be a string' })
  .trim()
  .min(1, 'review is required')
  .max(10_000, 'review must be 10000 characters or fewer')

export const createReviewSchema = z.object({
  bookId: z
    .string({ required_error: 'bookId is required', invalid_type_error: 'bookId must be a string' })
    .trim()
    .min(1, 'bookId is required')
    .max(100, 'bookId must be 100 characters or fewer'),
  title,
  review,
})

export const updateReviewSchema = z.object({
  title: title.optional(),
  review: review.optional(),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>
