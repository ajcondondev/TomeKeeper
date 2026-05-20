import { Router } from 'express'
import { getTickets, getTicket, getTicketEvents } from '../controllers/supportController.js'
import { authenticate } from '../middleware/authenticate.js'

export const supportRouter = Router()

supportRouter.use(authenticate)

supportRouter.get('/tickets', getTickets)
supportRouter.get('/tickets/:id', getTicket)
supportRouter.get('/tickets/:id/events', getTicketEvents)
