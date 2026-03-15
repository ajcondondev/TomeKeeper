import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { IBookService } from './BookService.interface'
import type { Book, NewBookInput } from '@/types/book.types'
import type { ApiResponse } from '@/types/api.types'
import { API_BASE_URL } from '@/config/env'

function makeClient(): AxiosInstance {
  const client = axios.create({ baseURL: `${API_BASE_URL}/api`, withCredentials: true })

  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      if (axios.isAxiosError(error) && error.response?.data) {
        const body = error.response.data as { message?: string }
        throw new Error(body.message ?? 'Request failed')
      }
      throw new Error('Network error — could not reach the server')
    },
  )

  return client
}

const http = makeClient()

export class ApiBookService implements IBookService {
  async getBooks(): Promise<Book[]> {
    const res = await http.get<ApiResponse<Book[]>>('/books')
    return res.data.data
  }

  async getBook(id: string): Promise<Book> {
    const res = await http.get<ApiResponse<Book>>(`/books/${id}`)
    return res.data.data
  }

  async addBook(input: NewBookInput): Promise<Book> {
    const res = await http.post<ApiResponse<Book>>('/books', input)
    return res.data.data
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    const res = await http.patch<ApiResponse<Book>>(`/books/${id}`, updates)
    return res.data.data
  }

  async deleteBook(id: string): Promise<void> {
    await http.delete(`/books/${id}`)
  }
}
