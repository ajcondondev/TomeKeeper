import { create } from 'zustand'
import type { Book, NewBookInput } from '@/types/book.types'
import { BookStatus } from '@/types/book.types'
import { getBookService } from '@/services'

type StoreStatus = 'idle' | 'loading' | 'success' | 'error'

interface BooksState {
  books: Book[]
  status: StoreStatus
  error: string | null
  loadBooks: () => Promise<void>
  addBook: (input: NewBookInput) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  toggleReadingList: (id: string) => Promise<void>
  removeBook: (id: string) => Promise<void>
}

const service = getBookService()

export const useBooksStore = create<BooksState>((set, get) => ({
  books: [],
  status: 'idle',
  error: null,

  loadBooks: async () => {
    set({ status: 'loading', error: null })
    try {
      const books = await service.getBooks()
      set({ books, status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load books',
      })
    }
  },

  addBook: async (input: NewBookInput) => {
    set({ status: 'loading', error: null })
    try {
      const newBook = await service.addBook(input)
      set({ books: [...get().books, newBook], status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to add book',
      })
    }
  },

  markAsRead: async (id: string) => {
    set({ status: 'loading', error: null })
    try {
      const book = get().books.find((b) => b.id === id)
      if (!book) return
      const newStatus =
        book.status === BookStatus.Read ? BookStatus.Unread : BookStatus.Read
      const updated = await service.updateBook(id, {
        status: newStatus,
        finishedAt:
          newStatus === BookStatus.Read ? new Date().toISOString() : null,
      })
      set({
        books: get().books.map((b) => (b.id === id ? updated : b)),
        status: 'success',
      })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to update book',
      })
    }
  },

  toggleReadingList: async (id: string) => {
    set({ status: 'loading', error: null })
    try {
      const book = get().books.find((b) => b.id === id)
      if (!book) return
      const newStatus =
        book.status === BookStatus.WantToRead
          ? BookStatus.Unread
          : BookStatus.WantToRead
      const updated = await service.updateBook(id, { status: newStatus })
      set({
        books: get().books.map((b) => (b.id === id ? updated : b)),
        status: 'success',
      })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to update book',
      })
    }
  },

  removeBook: async (id: string) => {
    set({ status: 'loading', error: null })
    try {
      await service.deleteBook(id)
      set({ books: get().books.filter((b) => b.id !== id), status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to remove book',
      })
    }
  },
}))
