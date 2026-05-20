import type { Request, Response, NextFunction } from 'express'
import { eq, and } from 'drizzle-orm'
import { db } from '../db/client.js'
import { imports, importRows } from '../db/schema.js'
import { AppError } from '../middleware/errorHandler.js'

type IdParam = { id: string }

function ok<T>(res: Response, data: T, message: string, status = 200): void {
  res.status(status).json({ success: true, message, data })
}

const IMPORT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'completed_with_errors',
] as const
type ImportStatus = (typeof IMPORT_STATUSES)[number]

function isImportStatus(value: unknown): value is ImportStatus {
  return typeof value === 'string' && (IMPORT_STATUSES as readonly string[]).includes(value)
}

export async function getImports(req: Request, res: Response): Promise<void> {
  const status = req.query.status
  const conditions = [eq(imports.userId, req.user!.id)]
  if (isImportStatus(status)) {
    conditions.push(eq(imports.status, status))
  }

  const rows = db
    .select()
    .from(imports)
    .where(and(...conditions))
    .all()
  ok(res, rows, 'Imports retrieved')
}

export async function getImport(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const row = db
    .select()
    .from(imports)
    .where(and(eq(imports.id, req.params.id), eq(imports.userId, req.user!.id)))
    .get()
  if (!row) return next(new AppError(404, `Import not found: ${req.params.id}`))
  ok(res, row, 'Import retrieved')
}

export async function getImportRows(
  req: Request<IdParam>,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parent = db
    .select()
    .from(imports)
    .where(and(eq(imports.id, req.params.id), eq(imports.userId, req.user!.id)))
    .get()
  if (!parent) return next(new AppError(404, `Import not found: ${req.params.id}`))

  const rows = db
    .select()
    .from(importRows)
    .where(eq(importRows.importId, req.params.id))
    .all()
  ok(res, rows, 'Import rows retrieved')
}
