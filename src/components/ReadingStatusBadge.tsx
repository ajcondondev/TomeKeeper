import type { BookStatus } from '@/types/book.types'
import { BookStatus as BS } from '@/types/book.types'
import { Badge } from '@/components/ui/badge'

interface ReadingStatusBadgeProps {
  status: BookStatus
}

const config: Record<
  BookStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'outline' }
> = {
  [BS.Unread]: { label: 'Unread', variant: 'outline' },
  [BS.Read]: { label: 'Read', variant: 'success' },
  [BS.WantToRead]: { label: 'Want to Read', variant: 'warning' },
}

export function ReadingStatusBadge({ status }: ReadingStatusBadgeProps) {
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
