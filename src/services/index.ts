import type { IBookService } from './BookService.interface'
import { MockBookService } from './MockBookService'
import { ApiBookService } from './ApiBookService'
import { ApiReviewService } from './ApiReviewService'
import { USE_MOCK_API } from '@/config/env'

// Singleton — instantiated once at module load time.
// Components and stores always import getBookService(), never a concrete class.
let bookInstance: IBookService | null = null
let reviewInstance: ApiReviewService | null = null

export function getBookService(): IBookService {
  if (bookInstance === null) {
    bookInstance = USE_MOCK_API ? new MockBookService() : new ApiBookService()
  }
  return bookInstance
}

export function getReviewService(): ApiReviewService {
  if (reviewInstance === null) {
    reviewInstance = new ApiReviewService()
  }
  return reviewInstance
}
