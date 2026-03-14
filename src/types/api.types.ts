// These types are defined now and used in Phase 2 when ApiBookService is implemented.

export interface ApiResponse<T> {
  data: T
  message: string
  success: boolean
}

export interface ApiError {
  message: string
  statusCode: number
  errors: string[] | null
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
