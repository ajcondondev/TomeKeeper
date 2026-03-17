import { Router } from 'express'
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewsController.js'
import { authenticate } from '../middleware/authenticate.js'

export const reviewsRouter = Router()

reviewsRouter.use(authenticate)

reviewsRouter.get('/', getReviews)
reviewsRouter.post('/', createReview)
reviewsRouter.patch('/:id', updateReview)
reviewsRouter.delete('/:id', deleteReview)
