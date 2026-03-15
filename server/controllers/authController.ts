import type { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { users } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

type PublicUser = { id: string; email: string }

function ok(res: Response, data: unknown, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email, password } = req.body as Record<string, unknown>

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return next(new AppError(400, 'A valid email is required'))
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return next(new AppError(400, 'Password must be at least 8 characters'))
  }

  const existing = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
  if (existing) {
    return next(new AppError(409, 'An account with that email already exists'))
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const newUser = {
    id: crypto.randomUUID(),
    email: email.toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  db.insert(users).values(newUser).run()

  req.session.userId = newUser.id
  const publicUser: PublicUser = { id: newUser.id, email: newUser.email }
  ok(res, publicUser, 'Account created', 201)
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { email, password } = req.body as Record<string, unknown>

  if (!email || typeof email !== 'string') {
    return next(new AppError(400, 'Email is required'))
  }
  if (!password || typeof password !== 'string') {
    return next(new AppError(400, 'Password is required'))
  }

  const user = db.select().from(users).where(eq(users.email, email.toLowerCase())).get()
  if (!user) {
    return next(new AppError(401, 'Invalid email or password'))
  }

  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) {
    return next(new AppError(401, 'Invalid email or password'))
  }

  req.session.userId = user.id
  const publicUser: PublicUser = { id: user.id, email: user.email }
  ok(res, publicUser, 'Logged in')
}

export function logout(req: Request, res: Response, next: NextFunction): void {
  req.session.destroy((err) => {
    if (err) return next(new AppError(500, 'Logout failed'))
    res.clearCookie('connect.sid')
    res.json({ success: true, message: 'Logged out', data: null })
  })
}

export function me(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.userId) {
    return next(new AppError(401, 'Not authenticated'))
  }

  const user = db.select().from(users).where(eq(users.id, req.session.userId)).get()
  if (!user) {
    req.session.destroy(() => {})
    return next(new AppError(401, 'Not authenticated'))
  }

  const publicUser: PublicUser = { id: user.id, email: user.email }
  ok(res, publicUser, 'Authenticated')
}
