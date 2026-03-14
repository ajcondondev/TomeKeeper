import { useEffect } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import { useBooksStore } from '@/store/booksStore'
import { useUiStore } from '@/store/uiStore'
import { BookList } from '@/components/BookList'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { EmptyState } from '@/components/EmptyState'
import { AddBookModal } from '@/components/AddBookModal'
import { Button } from '@/components/ui/button'

export function LibraryPage() {
  const books = useBooksStore((s) => s.books)
  const status = useBooksStore((s) => s.status)
  const error = useBooksStore((s) => s.error)
  const loadBooks = useBooksStore((s) => s.loadBooks)
  const markAsRead = useBooksStore((s) => s.markAsRead)
  const toggleReadingList = useBooksStore((s) => s.toggleReadingList)
  const removeBook = useBooksStore((s) => s.removeBook)
  const openModal = useUiStore((s) => s.openAddBookModal)

  useEffect(() => {
    if (status === 'idle') {
      void loadBooks()
    }
  }, [status, loadBooks])

  // Only show the full-page spinner during the initial load (books not yet fetched).
  // During subsequent operations (add, update, delete) the list stays visible.
  const isInitialLoad = status === 'loading' && books.length === 0

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Library</h2>
          {status === 'success' && (
            <p className="mt-0.5 text-sm text-gray-500">
              {books.length} {books.length === 1 ? 'book' : 'books'}
            </p>
          )}
        </div>
        <Button onClick={openModal}>
          <Plus className="h-4 w-4" />
          Add Book
        </Button>
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
      {status === 'success' && books.length === 0 && (
        <EmptyState
          message="Your library is empty. Add your first book to get started."
          ctaLabel="Add Book"
          onCta={openModal}
        />
      )}

      {/* Book grid */}
      {!isInitialLoad && books.length > 0 && (
        <BookList
          books={books}
          onMarkAsRead={markAsRead}
          onToggleReadingList={toggleReadingList}
          onRemove={removeBook}
        />
      )}

      <AddBookModal />
    </>
  )
}
