import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'

export const authRouter = Router()

authRouter.post('/register', authRateLimiter, register)
authRouter.post('/login', authRateLimiter, login)
authRouter.post('/logout', authenticate, logout)
authRouter.get('/me', me)
