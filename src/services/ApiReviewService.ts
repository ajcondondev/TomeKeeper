import axios from 'axios'
import type { AxiosInstance } from 'axios'
import type { Review, NewReviewInput, UpdateReviewInput } from '@/types/review.types'
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

export class ApiReviewService {
  async getReviews(): Promise<Review[]> {
    const res = await http.get<ApiResponse<Review[]>>('/reviews')
    return res.data.data
  }

  async createReview(input: NewReviewInput): Promise<Review> {
    const res = await http.post<ApiResponse<Review>>('/reviews', input)
    return res.data.data
  }

  async updateReview(id: string, updates: UpdateReviewInput): Promise<Review> {
    const res = await http.patch<ApiResponse<Review>>(`/reviews/${id}`, updates)
    return res.data.data
  }

  async deleteReview(id: string): Promise<void> {
    await http.delete(`/reviews/${id}`)
  }
}
