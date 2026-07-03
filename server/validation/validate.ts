import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../middleware/errorHandler.js'

/**
 * Parse and replace `req.body` with the schema's output (trimmed/normalised).
 * On failure, forwards a 400 AppError whose message is the first issue and
 * whose `errors` array lists every issue.
 */
export function validate(schema: ZodType): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const errors = result.error.issues.map((issue) => issue.message)
      return next(new AppError(400, errors[0] ?? 'Validation failed', errors))
    }
    req.body = result.data
    next()
  }
}
