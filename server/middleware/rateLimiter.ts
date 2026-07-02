import { rateLimit, ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

// Limits FAILED auth attempts (2xx/3xx responses don't count) per IP + email,
// so brute-forcing one account is throttled without a shared-IP budget that
// legitimate traffic — or a parallel test suite — could exhaust.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : ''
    return `${ipKeyGenerator(req.ip ?? '')}:${email}`
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please try again later.',
      statusCode: 429,
      errors: null,
    })
  },
})
