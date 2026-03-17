import { useEffect, useState } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { useReviewsStore } from '@/store/reviewsStore'
import { useBooksStore } from '@/store/booksStore'
import { ReviewCard } from '@/components/ReviewCard'
import { AddReviewModal } from '@/components/AddReviewModal'
import { EditReviewModal } from '@/components/EditReviewModal'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import type { Review } from '@/types/review.types'

export function ReviewsPage() {
  const reviews = useReviewsStore((s) => s.reviews)
  const status = useReviewsStore((s) => s.status)
  const error = useReviewsStore((s) => s.error)
  const loadReviews = useReviewsStore((s) => s.loadReviews)
  const removeReview = useReviewsStore((s) => s.removeReview)

  const booksStatus = useBooksStore((s) => s.status)
  const loadBooks = useBooksStore((s) => s.loadBooks)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  useEffect(() => {
    if (status === 'idle') void loadReviews()
  }, [status, loadReviews])

  useEffect(() => {
    if (booksStatus === 'idle') void loadBooks()
  }, [booksStatus, loadBooks])

  const isInitialLoad = status === 'loading' && reviews.length === 0

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Reviews</h2>
          {reviews.length > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
          )}
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Review
        </Button>
      </div>

      {isInitialLoad && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      {status === 'success' && reviews.length === 0 && (
        <EmptyState
          message="No reviews yet. Add your first review to get started."
          ctaLabel="Add Review"
          onCta={() => setIsAddOpen(true)}
        />
      )}

      {!isInitialLoad && reviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={setEditingReview}
              onDelete={(id) => void removeReview(id)}
            />
          ))}
        </div>
      )}

      <AddReviewModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <EditReviewModal review={editingReview} onClose={() => setEditingReview(null)} />
    </>
  )
}
