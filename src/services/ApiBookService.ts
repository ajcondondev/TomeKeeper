// Phase 2 placeholder — all methods throw until the real API is implemented.
// Replace with Axios calls once the Node.js backend is ready.

import type { IBookService } from './BookService.interface'
import type { Book, NewBookInput } from '@/types/book.types'

export class ApiBookService implements IBookService {
  async getBooks(): Promise<Book[]> {
    throw new Error('ApiBookService: not implemented — Phase 2 only')
  }

  async getBook(_id: string): Promise<Book> {
    throw new Error('ApiBookService: not implemented — Phase 2 only')
  }

  async addBook(_input: NewBookInput): Promise<Book> {
    throw new Error('ApiBookService: not implemented — Phase 2 only')
  }

  async updateBook(_id: string, _updates: Partial<Book>): Promise<Book> {
    throw new Error('ApiBookService: not implemented — Phase 2 only')
  }

  async deleteBook(_id: string): Promise<void> {
    throw new Error('ApiBookService: not implemented — Phase 2 only')
  }
}
