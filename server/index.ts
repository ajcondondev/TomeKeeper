import express from 'express'
import cors from 'cors'
import { booksRouter } from './routes/books.js'
import { errorHandler } from './middleware/errorHandler.js'
import { runMigrations } from './db/client.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

app.use('/api/books', booksRouter)

app.use(errorHandler)

runMigrations()

app.listen(PORT, () => {
  console.log(`TomeKeeper API running on http://localhost:${PORT}`)
})
