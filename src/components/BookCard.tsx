import { BookOpen, BookMarked, CheckCheck, Trash2, Undo2 } from 'lucide-react'
import type { Book } from '@/types/book.types'
import { BookStatus } from '@/types/book.types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ReadingStatusBadge } from '@/components/ReadingStatusBadge'

interface BookCardProps {
  book: Book
  onMarkAsRead: (id: string) => void
  onToggleReadingList: (id: string) => void
  onRemove: (id: string) => void
}

export function BookCard({
  book,
  onMarkAsRead,
  onToggleReadingList,
  onRemove,
}: BookCardProps) {
  const isRead = book.status === BookStatus.Read
  const isOnList = book.status === BookStatus.WantToRead

  return (
    <Card className="flex flex-col">
      {/* Cover */}
      <div className="flex h-40 items-center justify-center overflow-hidden rounded-t-xl bg-gray-100">
        {book.coverUrl ? (
          <img
            src={book.coverUrl}
            alt={`Cover for ${book.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-12 w-12 text-gray-300" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">
            {book.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">{book.author}</p>
        </div>

        <div className="flex flex-wrap gap-1">
          <ReadingStatusBadge status={book.status} />
          {book.genre && <Badge>{book.genre}</Badge>}
        </div>

        {book.pageCount !== null && (
          <p className="text-xs text-gray-400">{book.pageCount} pages</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 border-t border-gray-100 p-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onMarkAsRead(book.id)}
          title={isRead ? 'Mark as Unread' : 'Mark as Read'}
        >
          {isRead ? (
            <Undo2 className="h-3.5 w-3.5" />
          ) : (
            <CheckCheck className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isRead ? 'Unread' : 'Read'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-xs"
          onClick={() => onToggleReadingList(book.id)}
          title={isOnList ? 'Remove from Reading List' : 'Add to Reading List'}
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isOnList ? 'Remove' : 'Want to Read'}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={() => onRemove(book.id)}
          title="Delete book"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
