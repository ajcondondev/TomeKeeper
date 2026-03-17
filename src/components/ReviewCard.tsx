import { Pencil, Trash2 } from 'lucide-react'
import type { Review } from '@/types/review.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReviewCardProps {
  review: Review
  onEdit: (review: Review) => void
  onDelete: (id: string) => void
}

export function ReviewCard({ review, onEdit, onDelete }: ReviewCardProps) {
  const date = new Date(review.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">{review.title}</h3>
          <p className="mt-0.5 truncate text-xs text-indigo-600 font-medium">
            {review.bookTitle ?? 'Unknown book'}
            {review.bookAuthor ? (
              <span className="text-gray-400 font-normal"> · {review.bookAuthor}</span>
            ) : null}
          </p>
        </div>
        <p className="shrink-0 text-xs text-gray-400">{date}</p>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{review.review}</p>

      <div className="flex justify-end gap-1 border-t border-gray-100 pt-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onEdit(review)}
          title="Edit review"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={() => onDelete(review.id)}
          title="Delete review"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </Card>
  )
}
