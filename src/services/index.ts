import type { IBookService } from './BookService.interface'
import { MockBookService } from './MockBookService'
import { ApiBookService } from './ApiBookService'
import { USE_MOCK_API } from '@/config/env'

// Singleton — instantiated once at module load time.
// Components and stores always import getBookService(), never a concrete class.
let instance: IBookService | null = null

export function getBookService(): IBookService {
  if (instance === null) {
    instance = USE_MOCK_API ? new MockBookService() : new ApiBookService()
  }
  return instance
}
