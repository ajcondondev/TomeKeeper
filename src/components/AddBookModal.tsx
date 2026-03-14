import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useBooksStore } from '@/store/booksStore'
import { useUiStore } from '@/store/uiStore'

interface FormState {
  title: string
  author: string
  coverUrl: string
  genre: string
  pageCount: string
}

const EMPTY: FormState = {
  title: '',
  author: '',
  coverUrl: '',
  genre: '',
  pageCount: '',
}

export function AddBookModal() {
  const isOpen = useUiStore((s) => s.isAddBookModalOpen)
  const closeModal = useUiStore((s) => s.closeAddBookModal)
  const addBook = useBooksStore((s) => s.addBook)

  const [form, setForm] = useState<FormState>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Partial<FormState>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingCover, setIsFetchingCover] = useState(false)
  const [coverFetchError, setCoverFetchError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const handleClose = useCallback(() => {
    if (isSubmitting) return
    closeModal()
    setForm(EMPTY)
    setFieldErrors({})
    setCoverFetchError(null)
  }, [closeModal, isSubmitting])

  // Scroll lock + focus first field on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => titleRef.current?.focus())
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key
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
    if (field === 'coverUrl' && coverFetchError) {
      setCoverFetchError(null)
    }
  }

  function validate(): boolean {
    const next: Partial<FormState> = {}
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.author.trim()) next.author = 'Author is required'
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function fetchCover() {
    setCoverFetchError(null)
    setIsFetchingCover(true)
    try {
      const title = encodeURIComponent(form.title.trim())
      const author = form.author.trim() ? `&author=${encodeURIComponent(form.author.trim())}` : ''
      const url = `https://openlibrary.org/search.json?title=${title}${author}&limit=1`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Request failed')
      const data = (await response.json()) as { docs: Array<{ cover_i?: number }> }
      const coverId = data.docs[0]?.cover_i
      if (coverId === undefined) {
        setCoverFetchError('No cover found for this title.')
        return
      }
      updateField('coverUrl', `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`)
    } catch {
      setCoverFetchError('Could not reach Open Library. Check your connection.')
    } finally {
      setIsFetchingCover(false)
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    await addBook({
      title: form.title.trim(),
      author: form.author.trim(),
      coverUrl: form.coverUrl.trim() || undefined,
      genre: form.genre.trim() || undefined,
      pageCount: form.pageCount.trim() ? Number(form.pageCount) : undefined,
    })
    setIsSubmitting(false)
    const storeError = useBooksStore.getState().error
    if (!storeError) {
      closeModal()
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-book-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 id="add-book-title" className="text-base font-semibold text-gray-900">
            Add a Book
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

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-5">
            {/* Title */}
            <div>
              <label
                htmlFor="book-title"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="book-title"
                ref={titleRef}
                type="text"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                className={inputClass('title')}
                placeholder="e.g. Dune"
                autoComplete="off"
              />
              {fieldErrors.title && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.title}</p>
              )}
            </div>

            {/* Author */}
            <div>
              <label
                htmlFor="book-author"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Author <span className="text-red-500">*</span>
              </label>
              <input
                id="book-author"
                type="text"
                value={form.author}
                onChange={(e) => updateField('author', e.target.value)}
                className={inputClass('author')}
                placeholder="e.g. Frank Herbert"
                autoComplete="off"
              />
              {fieldErrors.author && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.author}</p>
              )}
            </div>

            {/* Genre */}
            <div>
              <label
                htmlFor="book-genre"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Genre
              </label>
              <input
                id="book-genre"
                type="text"
                value={form.genre}
                onChange={(e) => updateField('genre', e.target.value)}
                className={inputClass('genre')}
                placeholder="e.g. Science Fiction"
              />
            </div>

            {/* Pages */}
            <div>
              <label
                htmlFor="book-pages"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Pages
              </label>
              <input
                id="book-pages"
                type="number"
                min="1"
                value={form.pageCount}
                onChange={(e) => updateField('pageCount', e.target.value)}
                className={inputClass('pageCount')}
                placeholder="e.g. 412"
              />
            </div>

            {/* Cover URL */}
            <div>
              <label
                htmlFor="book-cover"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Cover URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="book-cover"
                  type="url"
                  value={form.coverUrl}
                  onChange={(e) => updateField('coverUrl', e.target.value)}
                  className={`${inputClass('coverUrl')} flex-1`}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!form.title.trim() || isFetchingCover || isSubmitting}
                  onClick={fetchCover}
                >
                  {isFetchingCover ? 'Finding...' : 'Find Cover'}
                </Button>
              </div>
              {coverFetchError && (
                <p className="mt-1 text-xs text-red-500">{coverFetchError}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Book'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
