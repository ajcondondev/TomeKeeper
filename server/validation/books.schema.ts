import { z } from 'zod'

const title = z
  .string({ required_error: 'title is required', invalid_type_error: 'title must be a string' })
  .trim()
  .min(1, 'title is required')
  .max(500, 'title must be 500 characters or fewer')

const author = z
  .string({ required_error: 'author is required', invalid_type_error: 'author must be a string' })
  .trim()
  .min(1, 'author is required')
  .max(300, 'author must be 300 characters or fewer')

const coverUrl = z
  .string({ invalid_type_error: 'coverUrl must be a string' })
  .trim()
  .max(2000, 'coverUrl must be 2000 characters or fewer')

const genre = z
  .string({ invalid_type_error: 'genre must be a string' })
  .trim()
  .max(100, 'genre must be 100 characters or fewer')

const pageCount = z
  .number({ invalid_type_error: 'pageCount must be a number' })
  .int('pageCount must be a whole number')
  .positive('pageCount must be positive')
  .max(100_000, 'pageCount must be 100000 or fewer')

export const createBookSchema = z.object({
  title,
  author,
  coverUrl: coverUrl.nullish(),
  genre: genre.nullish(),
  pageCount: pageCount.nullish(),
})

export const updateBookSchema = z
  .object({
    title: title.optional(),
    author: author.optional(),
    coverUrl: coverUrl.nullish(),
    genre: genre.nullish(),
    pageCount: pageCount.nullish(),
    status: z.enum(['unread', 'read', 'want-to-read'], {
      errorMap: () => ({ message: "status must be one of 'unread', 'read', 'want-to-read'" }),
    }).optional(),
    finishedAt: z
      .string({ invalid_type_error: 'finishedAt must be an ISO date string or null' })
      .max(40, 'finishedAt must be an ISO date string')
      .nullish(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'No valid fields provided for update',
  })

export type CreateBookInput = z.infer<typeof createBookSchema>
export type UpdateBookInput = z.infer<typeof updateBookSchema>
