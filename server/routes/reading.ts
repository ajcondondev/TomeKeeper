import { Router } from 'express'
import { getReadingSessions } from '../controllers/readingController.js'
import { authenticate } from '../middleware/authenticate.js'

export const readingRouter = Router()

readingRouter.use(authenticate)

readingRouter.get('/sessions', getReadingSessions)
