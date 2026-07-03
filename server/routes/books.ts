import { Router } from 'express'
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/booksController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate, createBookSchema, updateBookSchema } from '../validation/index.js'

export const booksRouter = Router()

booksRouter.use(authenticate)

booksRouter.get('/', getBooks)
booksRouter.get('/:id', getBook)
booksRouter.post('/', validate(createBookSchema), createBook)
booksRouter.patch('/:id', validate(updateBookSchema), updateBook)
booksRouter.delete('/:id', deleteBook)
