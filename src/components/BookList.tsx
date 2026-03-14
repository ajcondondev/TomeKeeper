import type { Book } from '@/types/book.types'
import { BookCard } from '@/components/BookCard'

interface BookListProps {
  books: Book[]
  onMarkAsRead: (id: string) => void
  onToggleReadingList: (id: string) => void
  onRemove: (id: string) => void
}

export function BookList({
  books,
  onMarkAsRead,
  onToggleReadingList,
  onRemove,
}: BookListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onMarkAsRead={onMarkAsRead}
          onToggleReadingList={onToggleReadingList}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
