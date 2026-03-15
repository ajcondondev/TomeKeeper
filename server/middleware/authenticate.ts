import type { Request, Response, NextFunction } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { AppError } from './errorHandler.js'

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const userId = req.session.userId
  if (!userId) {
    return next(new AppError(401, 'Not authenticated'))
  }

  const user = db.select().from(users).where(eq(users.id, userId)).get()
  if (!user) {
    return next(new AppError(401, 'Not authenticated'))
  }

  req.user = { id: user.id, email: user.email }
  next()
}
