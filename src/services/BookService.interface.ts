import type { Book, NewBookInput } from '@/types/book.types'

export interface IBookService {
  getBooks(): Promise<Book[]>
  getBook(id: string): Promise<Book>
  addBook(input: NewBookInput): Promise<Book>
  updateBook(id: string, updates: Partial<Book>): Promise<Book>
  deleteBook(id: string): Promise<void>
}
