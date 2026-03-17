import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useReviewsStore } from '@/store/reviewsStore'
import { useBooksStore } from '@/store/booksStore'

interface AddReviewModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  bookId: string
  title: string
  review: string
}

const EMPTY: FormState = { bookId: '', title: '', review: '' }

export function AddReviewModal({ isOpen, onClose }: AddReviewModalProps) {
  const addReview = useReviewsStore((s) => s.addReview)
  const books = useBooksStore((s) => s.books)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    onClose()
    setForm(EMPTY)
    setFieldErrors({})
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
    if (!form.bookId) next.bookId = 'Please select a book'
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.review.trim()) next.review = 'Review is required'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    await addReview({ bookId: form.bookId, title: form.title.trim(), review: form.review.trim() })
    setIsSubmitting(false)
    const storeError = useReviewsStore.getState().error
    if (!storeError) {
      onClose()
      setForm(EMPTY)
      setFieldErrors({})
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
        aria-labelledby="add-review-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="add-review-title" className="text-base font-semibold text-gray-900">
            Add a Review
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
            {/* Book */}
            <div>
              <label htmlFor="review-book" className="mb-1 block text-sm font-medium text-gray-700">
                Book <span className="text-red-500">*</span>
              </label>
              <select
                id="review-book"
                value={form.bookId}
                onChange={(e) => updateField('bookId', e.target.value)}
                className={inputClass('bookId')}
              >
                <option value="">Select a book…</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} — {book.author}
                  </option>
                ))}
              </select>
              {fieldErrors.bookId && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.bookId}</p>
              )}
            </div>

            {/* Review title */}
            <div>
              <label htmlFor="review-title" className="mb-1 block text-sm font-medium text-gray-700">
                Review Title <span className="text-red-500">*</span>
              </label>
              <input
                id="review-title"
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={inputClass('title')}
                placeholder="e.g. A masterpiece of science fiction"
                autoComplete="off"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
              )}
            </div>

            {/* Review text */}
            <div>
              <label htmlFor="review-text" className="mb-1 block text-sm font-medium text-gray-700">
                Review <span className="text-red-500">*</span>
              </label>
              <textarea
                id="review-text"
                value={form.review}
                onChange={(e) => updateField('review', e.target.value)}
                rows={5}
                className={cn(inputClass('review'), 'resize-none')}
                placeholder="Write your review or summary here…"
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
              {isSubmitting ? 'Adding…' : 'Add Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
