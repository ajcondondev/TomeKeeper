import { type APIRequestContext, type APIResponse } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared response envelope
// ---------------------------------------------------------------------------

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Domain types (mirrored from server — kept lightweight, no app imports)
// ---------------------------------------------------------------------------

export interface BookResponse {
  id: string;
  userId: string;
  title: string;
  author: string;
  status: 'unread' | 'read' | 'want-to-read';
  genre: string | null;
  pageCount: number | null;
  coverUrl: string | null;
  addedAt: string;
  finishedAt: string | null;
}

export interface ReviewResponse {
  id: string;
  bookId: string;
  userId: string;
  title: string;
  review: string;
  bookTitle: string | null;
  bookAuthor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserResponse {
  id: string;
  email: string;
}

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateBookInput {
  title: string;
  author: string;
  genre?: string;
  pageCount?: number;
  coverUrl?: string;
}

export interface UpdateBookInput {
  title?: string;
  author?: string;
  genre?: string;
  pageCount?: number;
  coverUrl?: string;
  status?: 'unread' | 'read' | 'want-to-read';
  finishedAt?: string | null;
}

export interface CreateReviewInput {
  bookId: string;
  title: string;
  review: string;
}

export interface UpdateReviewInput {
  title?: string;
  review?: string;
}

// ---------------------------------------------------------------------------
// ApiHelper
// ---------------------------------------------------------------------------

/**
 * Thin HTTP client for the TomeKeeper API.
 *
 * Designed to be used from Playwright fixtures — the `request` context carries
 * the authenticated session cookie from `storageState`, so callers do not need
 * to pass credentials.
 *
 * Convention:
 *  - Methods without "Raw" suffix parse the response and return domain objects.
 *    They throw on non-2xx status codes.
 *  - Methods with "Raw" suffix return the raw `APIResponse` for use in API
 *    contract tests where the status code itself is the assertion.
 */
export class ApiHelper {
  private readonly baseUrl: string;

  constructor(private readonly request: APIRequestContext) {
    this.baseUrl = process.env.API_URL ?? 'http://localhost:3001';
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  async registerRaw(email: string, password: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/register`, {
      data: { email, password },
    });
  }

  async loginRaw(email: string, password: string): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/login`, {
      data: { email, password },
    });
  }

  async logoutRaw(): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/auth/logout`);
  }

  async meRaw(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/auth/me`);
  }

  // ---------------------------------------------------------------------------
  // Books — convenience methods
  // ---------------------------------------------------------------------------

  async createBook(input: CreateBookInput): Promise<BookResponse> {
    const response = await this.createBookRaw(input);
    if (!response.ok()) {
      throw new Error(`createBook failed: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as ApiEnvelope<BookResponse>;
    return body.data;
  }

  async updateBook(id: string, input: UpdateBookInput): Promise<BookResponse> {
    const response = await this.updateBookRaw(id, input);
    if (!response.ok()) {
      throw new Error(`updateBook failed: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as ApiEnvelope<BookResponse>;
    return body.data;
  }

  async deleteBook(id: string): Promise<void> {
    const response = await this.deleteBookRaw(id);
    if (response.status() !== 204 && !response.ok()) {
      throw new Error(`deleteBook failed: ${response.status()} ${await response.text()}`);
    }
  }

  async getBooks(): Promise<BookResponse[]> {
    const response = await this.request.get(`${this.baseUrl}/api/books`);
    if (!response.ok()) {
      throw new Error(`getBooks failed: ${response.status()}`);
    }
    const body = (await response.json()) as ApiEnvelope<BookResponse[]>;
    return body.data;
  }

  async getBook(id: string): Promise<BookResponse> {
    const response = await this.getBookRaw(id);
    if (!response.ok()) {
      throw new Error(`getBook failed: ${response.status()}`);
    }
    const body = (await response.json()) as ApiEnvelope<BookResponse>;
    return body.data;
  }

  // ---------------------------------------------------------------------------
  // Books — raw methods (for API contract tests)
  // ---------------------------------------------------------------------------

  async createBookRaw(input: CreateBookInput): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/books`, { data: input });
  }

  async getBookRaw(id: string): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/books/${id}`);
  }

  async updateBookRaw(id: string, input: UpdateBookInput): Promise<APIResponse> {
    return this.request.patch(`${this.baseUrl}/api/books/${id}`, { data: input });
  }

  async deleteBookRaw(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/api/books/${id}`);
  }

  // ---------------------------------------------------------------------------
  // Reviews — convenience methods
  // ---------------------------------------------------------------------------

  async createReview(input: CreateReviewInput): Promise<ReviewResponse> {
    const response = await this.createReviewRaw(input);
    if (!response.ok()) {
      throw new Error(`createReview failed: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as ApiEnvelope<ReviewResponse>;
    return body.data;
  }

  async updateReview(id: string, input: UpdateReviewInput): Promise<ReviewResponse> {
    const response = await this.updateReviewRaw(id, input);
    if (!response.ok()) {
      throw new Error(`updateReview failed: ${response.status()} ${await response.text()}`);
    }
    const body = (await response.json()) as ApiEnvelope<ReviewResponse>;
    return body.data;
  }

  async deleteReview(id: string): Promise<void> {
    const response = await this.deleteReviewRaw(id);
    if (response.status() !== 204 && !response.ok()) {
      throw new Error(`deleteReview failed: ${response.status()} ${await response.text()}`);
    }
  }

  async getReviews(): Promise<ReviewResponse[]> {
    const response = await this.request.get(`${this.baseUrl}/api/reviews`);
    if (!response.ok()) {
      throw new Error(`getReviews failed: ${response.status()}`);
    }
    const body = (await response.json()) as ApiEnvelope<ReviewResponse[]>;
    return body.data;
  }

  // ---------------------------------------------------------------------------
  // Reviews — raw methods (for API contract tests)
  // ---------------------------------------------------------------------------

  async createReviewRaw(input: CreateReviewInput): Promise<APIResponse> {
    return this.request.post(`${this.baseUrl}/api/reviews`, { data: input });
  }

  async updateReviewRaw(id: string, input: UpdateReviewInput): Promise<APIResponse> {
    return this.request.patch(`${this.baseUrl}/api/reviews/${id}`, { data: input });
  }

  async deleteReviewRaw(id: string): Promise<APIResponse> {
    return this.request.delete(`${this.baseUrl}/api/reviews/${id}`);
  }

  async getBooksRaw(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/books`);
  }

  async getReviewsRaw(): Promise<APIResponse> {
    return this.request.get(`${this.baseUrl}/api/reviews`);
  }
}
