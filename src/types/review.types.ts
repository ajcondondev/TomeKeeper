export interface Review {
  id: string
  bookId: string
  title: string
  review: string
  createdAt: string
  updatedAt: string
  bookTitle: string | null
  bookAuthor: string | null
}

export interface NewReviewInput {
  bookId: string
  title: string
  review: string
}

export interface UpdateReviewInput {
  title?: string
  review?: string
}
