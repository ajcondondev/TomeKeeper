import { create } from 'zustand'
import type { Review, NewReviewInput, UpdateReviewInput } from '@/types/review.types'
import { getReviewService } from '@/services'

type StoreStatus = 'idle' | 'loading' | 'success' | 'error'

interface ReviewsState {
  reviews: Review[]
  status: StoreStatus
  error: string | null
  loadReviews: () => Promise<void>
  addReview: (input: NewReviewInput) => Promise<void>
  updateReview: (id: string, updates: UpdateReviewInput) => Promise<void>
  removeReview: (id: string) => Promise<void>
}

const service = getReviewService()

export const useReviewsStore = create<ReviewsState>((set, get) => ({
  reviews: [],
  status: 'idle',
  error: null,

  loadReviews: async () => {
    set({ status: 'loading', error: null })
    try {
      const reviews = await service.getReviews()
      set({ reviews, status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load reviews',
      })
    }
  },

  addReview: async (input: NewReviewInput) => {
    set({ status: 'loading', error: null })
    try {
      const newReview = await service.createReview(input)
      set({ reviews: [...get().reviews, newReview], status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to add review',
      })
    }
  },

  updateReview: async (id: string, updates: UpdateReviewInput) => {
    set({ status: 'loading', error: null })
    try {
      const updated = await service.updateReview(id, updates)
      set({
        reviews: get().reviews.map((r) => (r.id === id ? updated : r)),
        status: 'success',
      })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to update review',
      })
    }
  },

  removeReview: async (id: string) => {
    set({ status: 'loading', error: null })
    try {
      await service.deleteReview(id)
      set({ reviews: get().reviews.filter((r) => r.id !== id), status: 'success' })
    } catch (err) {
      set({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to delete review',
      })
    }
  },
}))
