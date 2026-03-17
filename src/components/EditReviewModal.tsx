import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useReviewsStore } from '@/store/reviewsStore'
import type { Review } from '@/types/review.types'

interface EditReviewModalProps {
  review: Review | null
  onClose: () => void
}

interface FormState {
  title: string
  review: string
}

export function EditReviewModal({ review, onClose }: EditReviewModalProps) {
  const updateReview = useReviewsStore((s) => s.updateReview)

  const [form, setForm] = useState<FormState>({ title: '', review: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const isOpen = review !== null

  useEffect(() => {
    if (review) {
      setForm({ title: review.title, review: review.review })
      setFieldErrors({})
    }
  }, [review])

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
  }, [onClose, isSubmitting])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => titleRef.current?.focus())
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function validate(): boolean {
    const next: Partial<FormState> = {}
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.review.trim()) next.review = 'Review is required'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate() || !review) return
    setIsSubmitting(true)
    await updateReview(review.id, { title: form.title.trim(), review: form.review.trim() })
    setIsSubmitting(false)
    const storeError = useReviewsStore.getState().error
    if (!storeError) {
      onClose()
    }
  }

  function inputClass(field: keyof FormState) {
    return cn(
      'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400',
      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
      fieldErrors[field] ? 'border-red-400' : 'border-gray-300',
    )
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-review-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="edit-review-title" className="text-base font-semibold text-gray-900">
            Edit Review
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Book — read-only */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Book</label>
              <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">
                {review?.bookTitle ?? 'Unknown book'}
                {review?.bookAuthor ? ` — ${review.bookAuthor}` : ''}
              </p>
            </div>

            {/* Review title */}
            <div>
              <label htmlFor="edit-review-title-input" className="mb-1 block text-sm font-medium text-gray-700">
                Review Title <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-review-title-input"
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={inputClass('title')}
                autoComplete="off"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
              )}
            </div>

            {/* Review text */}
            <div>
              <label htmlFor="edit-review-text" className="mb-1 block text-sm font-medium text-gray-700">
                Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-review-text"
                value={form.review}
                onChange={(e) => updateField('review', e.target.value)}
                rows={5}
                className={cn(inputClass('review'), 'resize-none')}
              />
              {fieldErrors.review && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.review}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
