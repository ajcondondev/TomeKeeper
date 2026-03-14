import type { IBookService } from './BookService.interface'
import type { Book, NewBookInput } from '@/types/book.types'
import { BookStatus } from '@/types/book.types'
import { getItem, setItem } from '@/lib/localStorage.adapter'
import { delay } from '@/lib/delay'
import { generateId } from '@/lib/generateId'

const BOOKS_STORAGE_KEY = 'tomekeeper:books'
const MOCK_DELAY_MS = 400

// Set to a value between 0–1 to simulate random failures (for QA use later).
const MOCK_FAILURE_RATE = 0

const SEED_BOOKS: Book[] = [
  {
    id: 'seed-1',
    title: 'The Pragmatic Programmer',
    author: 'David Thomas & Andrew Hunt',
    coverUrl: null,
    genre: 'Technology',
    pageCount: 352,
    status: BookStatus.Read,
    addedAt: new Date('2024-01-15').toISOString(),
    finishedAt: new Date('2024-02-10').toISOString(),
  },
  {
    id: 'seed-2',
    title: 'Dune',
    author: 'Frank Herbert',
    coverUrl: null,
    genre: 'Science Fiction',
    pageCount: 412,
    status: BookStatus.WantToRead,
    addedAt: new Date('2024-02-01').toISOString(),
    finishedAt: null,
  },
  {
    id: 'seed-3',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    coverUrl: null,
    genre: 'Science Fiction',
    pageCount: 476,
    status: BookStatus.Read,
    addedAt: new Date('2024-03-01').toISOString(),
    finishedAt: new Date('2024-03-20').toISOString(),
  },
  {
    id: 'seed-4',
    title: 'The Design of Everyday Things',
    author: 'Don Norman',
    coverUrl: null,
    genre: 'Design',
    pageCount: 368,
    status: BookStatus.Unread,
    addedAt: new Date('2024-04-01').toISOString(),
    finishedAt: null,
  },
  {
    id: 'seed-5',
    title: 'Atomic Habits',
    author: 'James Clear',
    coverUrl: null,
    genre: 'Self-Help',
    pageCount: 320,
    status: BookStatus.WantToRead,
    addedAt: new Date('2024-04-15').toISOString(),
    finishedAt: null,
  },
]

function maybeReject(): void {
  if (MOCK_FAILURE_RATE > 0 && Math.random() < MOCK_FAILURE_RATE) {
    throw new Error('Mock service simulated failure')
  }
}

function readStorage(): Book[] {
  return getItem<Book[]>(BOOKS_STORAGE_KEY) ?? []
}

function writeStorage(books: Book[]): void {
  setItem(BOOKS_STORAGE_KEY, books)
}

function ensureSeeded(): void {
  const existing = getItem<Book[]>(BOOKS_STORAGE_KEY)
  if (existing === null) {
    writeStorage(SEED_BOOKS)
  }
}

export class MockBookService implements IBookService {
  constructor() {
    ensureSeeded()
  }

  async getBooks(): Promise<Book[]> {
    await delay(MOCK_DELAY_MS)
    maybeReject()
    return readStorage()
  }

  async getBook(id: string): Promise<Book> {
    await delay(MOCK_DELAY_MS)
    maybeReject()
    const book = readStorage().find((b) => b.id === id)
    if (!book) throw new Error(`Book not found: ${id}`)
    return book
  }

  async addBook(input: NewBookInput): Promise<Book> {
    await delay(MOCK_DELAY_MS)
    maybeReject()
    const newBook: Book = {
      id: generateId(),
      title: input.title,
      author: input.author,
      coverUrl: input.coverUrl ?? null,
      genre: input.genre ?? null,
      pageCount: input.pageCount ?? null,
      status: BookStatus.Unread,
      addedAt: new Date().toISOString(),
      finishedAt: null,
    }
    writeStorage([...readStorage(), newBook])
    return newBook
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    await delay(300)
    maybeReject()
    const books = readStorage()
    const index = books.findIndex((b) => b.id === id)
    if (index === -1) throw new Error(`Book not found: ${id}`)
    const updated: Book = { ...books[index]!, ...updates }
    books[index] = updated
    writeStorage(books)
    return updated
  }

  async deleteBook(id: string): Promise<void> {
    await delay(300)
    maybeReject()
    writeStorage(readStorage().filter((b) => b.id !== id))
  }
}
