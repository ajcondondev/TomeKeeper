import express from 'express'
import cors from 'cors'
import session from 'express-session'
import Database from 'better-sqlite3'
import sqliteStoreFactory from 'better-sqlite3-session-store'
import path from 'path'
import { fileURLToPath } from 'url'
import { booksRouter } from './routes/books.js'
import { authRouter } from './routes/auth.js'
import { reviewsRouter } from './routes/reviews.js'
import { readingRouter } from './routes/reading.js'
import { importsRouter } from './routes/imports.js'
import { supportRouter } from './routes/support.js'
import { errorHandler } from './middleware/errorHandler.js'
import { runMigrations } from './db/client.js'

const app = express()
const PORT = process.env.PORT ?? 3001
const isProduction = process.env.NODE_ENV === 'production'

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in production')
}

if (isProduction) {
  // Trust the first proxy (e.g. Fly/Render load balancer) so secure cookies work.
  app.set('trust proxy', 1)
}

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))

app.use(express.json({ limit: '100kb' }))

// Sessions persist in SQLite so server restarts don't log users out.
const SqliteStore = sqliteStoreFactory(session)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionDb = new Database(path.resolve(__dirname, '../data/sessions.db'))
sessionDb.pragma('journal_mode = WAL')

app.use(session({
  store: new SqliteStore({
    client: sessionDb,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  }),
  secret: process.env.SESSION_SECRET ?? 'tomekeeper-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}))

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRouter)
app.use('/api/books', booksRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/reading', readingRouter)
app.use('/api/imports', importsRouter)
app.use('/api/support', supportRouter)

app.use(errorHandler)

runMigrations()

app.listen(PORT, () => {
  console.log(`TomeKeeper API running on http://localhost:${PORT}`)
})
