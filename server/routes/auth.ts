import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter } from '../middleware/rateLimiter.js'
import { validate, registerSchema, loginSchema } from '../validation/index.js'

export const authRouter = Router()

authRouter.post('/register', authRateLimiter, validate(registerSchema), register)
authRouter.post('/login', authRateLimiter, validate(loginSchema), login)
authRouter.post('/logout', authenticate, logout)
authRouter.get('/me', me)
