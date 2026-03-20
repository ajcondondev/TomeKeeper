import express from 'express'
import cors from 'cors'
import session from 'express-session'
import { booksRouter } from './routes/books.js'
import { authRouter } from './routes/auth.js'
import { reviewsRouter } from './routes/reviews.js'
import { errorHandler } from './middleware/errorHandler.js'
import { runMigrations } from './db/client.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))

app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET ?? 'tomekeeper-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}))

app.use('/api/auth', authRouter)
app.use('/api/books', booksRouter)
app.use('/api/reviews', reviewsRouter)

app.use(errorHandler)

runMigrations()

app.listen(PORT, () => {
  console.log(`TomeKeeper API running on http://localhost:${PORT}`)
})
