import type { Request, Response, NextFunction } from 'express'
import { eq, and, type SQL } from 'drizzle-orm'
import { db } from '../db/client.js'
import { supportTickets, ticketEvents } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

type IdParam = { id: string }

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

const STATUSES = ['open', 'pending', 'resolved', 'closed'] as const
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const CATEGORIES = [
  'account',
  'catalog',
  'review',
  'import',
  'reading_progress',
  'cover_art',
  'data_quality',
  'bug_report',
] as const

function matches<T extends readonly string[]>(allowed: T, value: unknown): value is T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

export async function getTickets(req: Request, res: Response): Promise<void> {
  const conditions: SQL[] = [eq(supportTickets.userId, req.user!.id)]
  if (matches(STATUSES, req.query.status)) {
    conditions.push(eq(supportTickets.status, req.query.status))
  }
  if (matches(PRIORITIES, req.query.priority)) {
    conditions.push(eq(supportTickets.priority, req.query.priority))
  }
  if (matches(CATEGORIES, req.query.category)) {
    conditions.push(eq(supportTickets.category, req.query.category))
  }

  const rows = db
    .select()
    .from(supportTickets)
    .where(and(...conditions))
    .all()
  ok(res, rows, 'Support tickets retrieved')
}

export async function getTicket(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const row = db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, req.params.id), eq(supportTickets.userId, req.user!.id)))
    .get()
  if (!row) return next(new AppError(404, `Support ticket not found: ${req.params.id}`))
  ok(res, row, 'Support ticket retrieved')
}

export async function getTicketEvents(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ticket = db
    .select()
    .from(supportTickets)
    .where(and(eq(supportTickets.id, req.params.id), eq(supportTickets.userId, req.user!.id)))
    .get()
  if (!ticket) return next(new AppError(404, `Support ticket not found: ${req.params.id}`))

  const rows = db
    .select()
    .from(ticketEvents)
    .where(eq(ticketEvents.ticketId, req.params.id))
    .all()
  ok(res, rows, 'Ticket events retrieved')
}
