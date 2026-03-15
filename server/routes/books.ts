import { Router } from 'express'
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/booksController.js'
import { authenticate } from '../middleware/authenticate.js'

export const booksRouter = Router()

booksRouter.use(authenticate)

booksRouter.get('/', getBooks)
booksRouter.get('/:id', getBook)
booksRouter.post('/', createBook)
booksRouter.patch('/:id', updateBook)
booksRouter.delete('/:id', deleteBook)
