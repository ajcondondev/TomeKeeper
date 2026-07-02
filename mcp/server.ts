import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// TomeKeeper MCP server
//
// Exposes the TomeKeeper REST API as MCP tools so any MCP client (Claude Code,
// Claude Desktop, etc.) can manage a library conversationally. Runs over stdio.
//
// Configuration (env vars):
//   TOMEKEEPER_API_URL   — API base URL (default http://localhost:3001)
//   TOMEKEEPER_EMAIL     — account to use (default mcp-agent@tomekeeper.dev)
//   TOMEKEEPER_PASSWORD  — account password (default mcp-agent-password)
//
// The server logs in on first tool call, registering the account if it does
// not exist yet. All tools operate on that account's private library.
// ---------------------------------------------------------------------------

const API_URL = process.env.TOMEKEEPER_API_URL ?? 'http://localhost:3001'
const EMAIL = process.env.TOMEKEEPER_EMAIL ?? 'mcp-agent@tomekeeper.dev'
const PASSWORD = process.env.TOMEKEEPER_PASSWORD ?? 'mcp-agent-password'

type BookStatus = 'unread' | 'read' | 'want-to-read'

interface Book {
  id: string
  title: string
  author: string
  status: BookStatus
  genre: string | null
  pageCount: number | null
  coverUrl: string | null
  addedAt: string
  finishedAt: string | null
}

interface Review {
  id: string
  bookId: string
  title: string
  review: string
  createdAt: string
}

interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

// ---------------------------------------------------------------------------
// API client — session-cookie auth against the Express API
// ---------------------------------------------------------------------------

class ApiClient {
  private cookie: string | null = null

  private async request(method: string, path: string, body?: unknown): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (this.cookie) headers.Cookie = this.cookie

    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })

    const setCookie = response.headers.get('set-cookie')
    if (setCookie) this.cookie = setCookie.split(';')[0]

    return response
  }

  private async ensureAuth(): Promise<void> {
    if (this.cookie) return

    const login = await this.request('POST', '/api/auth/login', { email: EMAIL, password: PASSWORD })
    if (login.ok) return

    const register = await this.request('POST', '/api/auth/register', { email: EMAIL, password: PASSWORD })
    if (!register.ok) {
      throw new Error(`Authentication failed: login ${login.status}, register ${register.status}`)
    }
  }

  async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    await this.ensureAuth()

    let response = await this.request(method, path, body)
    if (response.status === 401) {
      // Session expired — re-authenticate once and retry.
      this.cookie = null
      await this.ensureAuth()
      response = await this.request(method, path, body)
    }

    if (response.status === 204) return null as T
    const json = (await response.json()) as ApiEnvelope<T> & { message?: string }
    if (!response.ok) {
      throw new Error(`${method} ${path} failed (${response.status}): ${json.message ?? 'unknown error'}`)
    }
    return json.data
  }
}

const api = new ApiClient()

// ---------------------------------------------------------------------------
// MCP server + tools
// ---------------------------------------------------------------------------

const server = new McpServer({ name: 'tomekeeper', version: '0.1.0' })

function text(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }] }
}

function errorText(err: unknown) {
  return {
    content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }],
    isError: true,
  }
}

server.registerTool(
  'search_library',
  {
    description:
      'Search the TomeKeeper library. Returns books matching an optional text query (title/author/genre substring, case-insensitive) and/or reading status. Omit both to list all books.',
    inputSchema: {
      query: z.string().optional().describe('Substring to match against title, author, or genre'),
      status: z.enum(['unread', 'read', 'want-to-read']).optional().describe('Filter by reading status'),
    },
  },
  async ({ query, status }) => {
    try {
      let books = await api.call<Book[]>('GET', '/api/books')
      if (status) books = books.filter((b) => b.status === status)
      if (query) {
        const q = query.toLowerCase()
        books = books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            (b.genre ?? '').toLowerCase().includes(q),
        )
      }
      return text(books.map(({ id, title, author, status: s, genre, pageCount }) => ({ id, title, author, status: s, genre, pageCount })))
    } catch (err) {
      return errorText(err)
    }
  },
)

server.registerTool(
  'add_book',
  {
    description: 'Add a book to the TomeKeeper library. New books start with status "unread".',
    inputSchema: {
      title: z.string().min(1).describe('Book title'),
      author: z.string().min(1).describe('Author name'),
      genre: z.string().optional().describe('Genre (optional)'),
      pageCount: z.number().int().positive().optional().describe('Number of pages (optional)'),
    },
  },
  async (input) => {
    try {
      const book = await api.call<Book>('POST', '/api/books', input)
      return text(book)
    } catch (err) {
      return errorText(err)
    }
  },
)

server.registerTool(
  'update_reading_status',
  {
    description: 'Update the reading status of a book (unread, read, or want-to-read). Use search_library first to find the book id.',
    inputSchema: {
      bookId: z.string().describe('Book id from search_library'),
      status: z.enum(['unread', 'read', 'want-to-read']).describe('New reading status'),
    },
  },
  async ({ bookId, status }) => {
    try {
      const book = await api.call<Book>('PATCH', `/api/books/${bookId}`, { status })
      return text(book)
    } catch (err) {
      return errorText(err)
    }
  },
)

server.registerTool(
  'delete_book',
  {
    description: 'Delete a book from the library permanently. Use search_library first to find the book id.',
    inputSchema: {
      bookId: z.string().describe('Book id from search_library'),
    },
  },
  async ({ bookId }) => {
    try {
      await api.call<null>('DELETE', `/api/books/${bookId}`)
      return text({ deleted: bookId })
    } catch (err) {
      return errorText(err)
    }
  },
)

server.registerTool(
  'add_review',
  {
    description: 'Write a review for a book in the library. Use search_library first to find the book id.',
    inputSchema: {
      bookId: z.string().describe('Book id from search_library'),
      title: z.string().min(1).describe('Review headline'),
      review: z.string().min(1).describe('Review body text'),
    },
  },
  async (input) => {
    try {
      const review = await api.call<Review>('POST', '/api/reviews', input)
      return text(review)
    } catch (err) {
      return errorText(err)
    }
  },
)

server.registerTool(
  'get_reading_stats',
  {
    description: 'Get reading statistics for the library: totals by status, pages read, and genre breakdown.',
    inputSchema: {},
  },
  async () => {
    try {
      const books = await api.call<Book[]>('GET', '/api/books')

      const byStatus = { unread: 0, read: 0, 'want-to-read': 0 }
      const byGenre: Record<string, number> = {}
      let pagesRead = 0

      for (const book of books) {
        byStatus[book.status] += 1
        if (book.status === 'read' && book.pageCount) pagesRead += book.pageCount
        const genre = book.genre ?? 'Uncategorized'
        byGenre[genre] = (byGenre[genre] ?? 0) + 1
      }

      return text({ totalBooks: books.length, byStatus, pagesRead, byGenre })
    } catch (err) {
      return errorText(err)
    }
  },
)

// ---------------------------------------------------------------------------

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`TomeKeeper MCP server connected (API: ${API_URL}, user: ${EMAIL})`)
