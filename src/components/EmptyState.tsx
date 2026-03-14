import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  message: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="mb-4 h-12 w-12 text-gray-300" />
      <p className="text-gray-500">{message}</p>
      {ctaLabel && onCta && (
        <Button className="mt-4" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </div>
  )
}
