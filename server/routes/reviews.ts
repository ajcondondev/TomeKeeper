import { Router } from 'express'
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewsController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validate, createReviewSchema, updateReviewSchema } from '../validation/index.js'

export const reviewsRouter = Router()

reviewsRouter.use(authenticate)

reviewsRouter.get('/', getReviews)
reviewsRouter.post('/', validate(createReviewSchema), createReview)
reviewsRouter.patch('/:id', validate(updateReviewSchema), updateReview)
reviewsRouter.delete('/:id', deleteReview)
