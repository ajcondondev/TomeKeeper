import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useBooksStore } from '@/store/booksStore'
import { BookStatus } from '@/types/book.types'
import { BookList } from '@/components/BookList'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'

export function ReadingListPage() {
  const books = useBooksStore((s) => s.books)
  const status = useBooksStore((s) => s.status)
  const error = useBooksStore((s) => s.error)
  const loadBooks = useBooksStore((s) => s.loadBooks)
  const markAsRead = useBooksStore((s) => s.markAsRead)
  const toggleReadingList = useBooksStore((s) => s.toggleReadingList)
  const removeBook = useBooksStore((s) => s.removeBook)
  const navigate = useNavigate()

  useEffect(() => {
    if (status === 'idle') {
      void loadBooks()
    }
  }, [status, loadBooks])

  // Derive reading list from the shared store — no separate fetch
  const readingListBooks = books.filter((b) => b.status === BookStatus.WantToRead)
  const isInitialLoad = status === 'loading' && books.length === 0

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Reading List</h2>
        {status === 'success' && (
          <p className="mt-0.5 text-sm text-gray-500">
            {readingListBooks.length}{' '}
            {readingListBooks.length === 1 ? 'book' : 'books'}
          </p>
        )}
      </div>

      {/* Initial load spinner */}
      {isInitialLoad && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      {/* Empty state */}
      {!isInitialLoad && status !== 'error' && readingListBooks.length === 0 && (
        <EmptyState
          message="No books on your reading list yet. Mark books as 'Want to Read' from your library."
          ctaLabel="Go to Library"
          onCta={() => { void navigate('/library') }}
        />
      )}

      {/* Book grid */}
      {readingListBooks.length > 0 && (
        <BookList
          books={readingListBooks}
          onMarkAsRead={markAsRead}
          onToggleReadingList={toggleReadingList}
          onRemove={removeBook}
        />
      )}
    </div>
  )
}
