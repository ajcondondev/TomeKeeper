# TomeKeeper — Architecture Blueprint & Implementation Plan

---

## 1. Project Overview & MVP Scope

TomeKeeper is a personal library and reading tracker web application. Users can maintain a digital catalog of books they own, are reading, or have finished.

**MVP Goal:** Deliver a working, visually complete single-page application backed entirely by a mock service layer. The mock layer must simulate real async behavior (loading states, artificial delays) so that swapping in a real backend in Phase 2 requires zero changes to React components and minimal changes to service files.

**MVP Feature Set (Phase 1):**
- View all books in the library (grid or list view)
- Add a new book (title, author, cover URL, genre, page count)
- Mark a book as "read" or "unread"
- Add a book to / remove from a reading list ("Want to Read")
- Persist data in localStorage so state survives page refreshes

**Explicitly Out of Scope for MVP:**
- User authentication or accounts
- Ratings, reviews, notes
- Search or filter
- Analytics or charts
- Social or sharing features
- Real backend or database

---

## 2. Tech Stack with Justifications

| Layer | Choice | Justification |
|---|---|---|
| Language | TypeScript (strict mode) | Catches type errors early; types serve as documentation; essential for a clean mock-to-real migration |
| UI Framework | React 18 | Industry standard; large ecosystem; concurrent features available when needed |
| Build Tool | Vite | Fast HMR; minimal config; first-class TypeScript support |
| Styling | Tailwind CSS | Utility-first; consistent design tokens; no CSS-in-JS runtime overhead |
| UI Primitives | shadcn/ui | Accessible components (Dialog, Card, Badge); copy-owned, not a black-box library |
| State Management | Zustand | Minimal boilerplate; simpler than Context + useReducer for this scale; easy to extend later |
| Routing | React Router v6 | Standard; nested routes API works well for layout shells |
| Icons | Lucide React | Tree-shakable; consistent design language; TypeScript-native |
| Data Persistence (Phase 1) | localStorage via custom adapter | Zero dependencies; survives refresh; trivially replaceable |
| HTTP Client (Phase 2 only) | Axios | Interceptors simplify auth headers and error normalization later |
| Backend (Phase 2) | Node.js + Express | Minimal surface area; TypeScript-compatible; fast to stand up |
| Database (Phase 2) | SQLite (dev) / PostgreSQL (prod) | SQLite for zero-config local dev; Postgres for production parity |
| ORM (Phase 2) | Drizzle ORM | TypeScript-native schema; lightweight; great migration story |

**Why not Next.js?** TomeKeeper is a client-only SPA in Phase 1. Next.js adds SSR/SSG complexity that provides no benefit here and would complicate the mock layer architecture.

**Why not React Query?** React Query adds a caching layer that partially duplicates what Zustand manages. For this scale, Zustand + the service layer pattern is more transparent.

---

## 3. System Architecture

The architecture is deliberately layered so that each layer has one reason to change.

```
┌─────────────────────────────────────────────────────┐
│                  React Components                    │
│         (Pages + UI Components — pure UI)            │
└──────────────────────┬──────────────────────────────┘
                       │ calls
┌──────────────────────▼──────────────────────────────┐
│                  Zustand Store(s)                    │
│    (booksStore, uiStore — app state)                 │
└──────────────────────┬──────────────────────────────┘
                       │ dispatches to / calls
┌──────────────────────▼──────────────────────────────┐
│              Service Layer (interface)               │
│     IBookService — addBook, getBooks, etc.           │
└──────┬───────────────────────────────────┬──────────┘
       │                                   │
┌──────▼──────────┐               ┌────────▼──────────┐
│  MockBookService│               │  ApiBookService    │
│  (Phase 1)      │               │  (Phase 2)         │
│  localStorage + │               │  Axios → REST API  │
│  artificial delay│              │                    │
└─────────────────┘               └────────────────────┘
```

**Key architectural decisions:**

1. **Dependency injection via a factory function.** A single `getBookService()` factory reads an environment variable (`VITE_USE_MOCK_API`) and returns either the mock or real service. Components and stores never import a concrete service directly.

2. **Stores call services; components call stores.** React components are never aware of how data is fetched. They subscribe to Zustand slices and dispatch actions.

3. **Loading and error state live in the store.** Every async store action sets `status: 'idle' | 'loading' | 'success' | 'error'`. Components derive loading spinners from this state.

4. **Mock service simulates async faithfully.** All mock methods use `Promise` + `setTimeout` with a configurable delay (default 400ms). They can also be configured to simulate failure rates.

---

## 4. Folder Structure

```
tomekeeper/
├── public/
│   └── placeholder-cover.png          # Default book cover image
│
├── src/
│   ├── main.tsx                        # Vite entry point
│   ├── App.tsx                         # Router setup, layout wrapper
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui generated components
│   │   ├── BookCard.tsx                # Single book tile
│   │   ├── BookList.tsx                # Renders a list of BookCards
│   │   ├── AddBookModal.tsx            # Modal form for adding a new book
│   │   ├── ReadingStatusBadge.tsx      # "Read" / "Want to Read" badge
│   │   ├── EmptyState.tsx              # Shown when library is empty
│   │   ├── LoadingSpinner.tsx          # Spinner for async operations
│   │   └── Layout/
│   │       ├── AppShell.tsx            # Nav + sidebar + main content
│   │       ├── Navbar.tsx
│   │       └── Sidebar.tsx
│   │
│   ├── pages/
│   │   ├── LibraryPage.tsx             # /library — full book grid
│   │   ├── ReadingListPage.tsx         # /reading-list — "Want to Read" view
│   │   └── NotFoundPage.tsx
│   │
│   ├── store/
│   │   ├── booksStore.ts               # books[], status, error + actions
│   │   └── uiStore.ts                  # modal state, view mode
│   │
│   ├── services/
│   │   ├── BookService.interface.ts    # TypeScript interface (the contract)
│   │   ├── MockBookService.ts          # Phase 1 implementation
│   │   ├── ApiBookService.ts           # Phase 2 implementation (stub in P1)
│   │   └── index.ts                    # Factory: getBookService()
│   │
│   ├── types/
│   │   ├── book.types.ts               # Book, BookStatus, NewBookInput
│   │   └── api.types.ts                # ApiResponse<T>, PaginatedResponse<T>
│   │
│   ├── hooks/
│   │   ├── useBooks.ts                 # Reads booksStore
│   │   └── useAddBook.ts               # Add-book flow + modal state
│   │
│   ├── lib/
│   │   ├── localStorage.adapter.ts     # Typed get/set/remove wrappers
│   │   ├── delay.ts                    # sleep(ms): Promise<void>
│   │   └── generateId.ts              # crypto.randomUUID() wrapper
│   │
│   └── config/
│       └── env.ts                      # Typed env variable exports
│
├── docs/                               # Planning and architecture documents
├── .env.development                    # VITE_USE_MOCK_API=true
├── .env.production                     # VITE_USE_MOCK_API=false
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 5. Pages and UI Components

### Pages

**LibraryPage (`/library`)**
- Default route (redirected from `/`)
- On mount: dispatches `loadBooks()` from booksStore
- Shows `<LoadingSpinner>` while `status === 'loading'`
- Shows `<EmptyState>` when books array is empty and status is success
- Shows `<BookList>` with all books when populated

**ReadingListPage (`/reading-list`)**
- Filtered view: only books where `status === 'want-to-read'`
- Derives data from booksStore (already loaded — no separate fetch)

**NotFoundPage (`*`)**
- Simple centered message with link back to library

### Component Hierarchy

```
AppShell
├── Navbar
├── Sidebar
│   ├── NavLink: "My Library"
│   └── NavLink: "Reading List"
└── <Outlet />
    ├── LibraryPage
    │   ├── BookList
    │   │   └── BookCard (×n)
    │   │       ├── cover image
    │   │       ├── title, author
    │   │       ├── ReadingStatusBadge
    │   │       └── action buttons: Mark Read, Add to List, Remove
    │   ├── LoadingSpinner (conditional)
    │   ├── EmptyState (conditional)
    │   └── AddBookButton → AddBookModal
    └── ReadingListPage
        └── BookList (filtered subset)
```

### Component Responsibilities

| Component | Props | Responsibility |
|---|---|---|
| `BookCard` | `book: Book` | Display one book; emit action intents via callbacks |
| `BookList` | `books: Book[]` | Map books to BookCards |
| `AddBookModal` | `isOpen`, `onClose`, `onSubmit` | Controlled modal with form validation |
| `ReadingStatusBadge` | `status: BookStatus` | Visual label only, no logic |
| `EmptyState` | `message`, `ctaLabel?`, `onCta?` | Reusable empty view |
| `LoadingSpinner` | `size?`, `label?` | Accessible loading indicator |

---

## 6. State Management

**Zustand** with one data store and one UI store.

### booksStore

```
State:
  books:   Book[]
  status:  'idle' | 'loading' | 'success' | 'error'
  error:   string | null

Actions:
  loadBooks()            — fetch all books from service, set status
  addBook(input)         — call service, append to books[]
  markAsRead(id)         — call service, update book in books[]
  toggleReadingList(id)  — call service, toggle want-to-read status
  removeBook(id)         — call service, filter book from books[]
```

### uiStore

```
State:
  isAddBookModalOpen: boolean
  viewMode:           'grid' | 'list'

Actions:
  openAddBookModal()
  closeAddBookModal()
  setViewMode(mode)
```

**Async action pattern — every action follows this sequence:**
1. `set({ status: 'loading', error: null })`
2. Await service method
3. On success: `set({ books: updatedBooks, status: 'success' })`
4. On failure: `set({ status: 'error', error: err.message })`

**Rule on derived state:** `readingListBooks` is NOT stored in state. It is always `books.filter(b => b.status === 'want-to-read')`. Storing derived state redundantly causes sync bugs.

---

## 7. Service Layer Design

The service layer is the critical seam between Phase 1 and Phase 2.

### Interface Contract (`BookService.interface.ts`)

```typescript
interface IBookService {
  getBooks(): Promise<Book[]>
  getBook(id: string): Promise<Book>
  addBook(input: NewBookInput): Promise<Book>
  updateBook(id: string, updates: Partial<Book>): Promise<Book>
  deleteBook(id: string): Promise<void>
}
```

Every method returns a `Promise`. No synchronous methods. The mock must behave identically to a network call.

### The Factory (`services/index.ts`)

Checks `import.meta.env.VITE_USE_MOCK_API`. Returns a singleton `MockBookService` when `true`, `ApiBookService` when `false`. This is the only place the environment variable is read. Everything upstream is environment-agnostic.

### Store Usage

```typescript
// booksStore.ts — top of file, module scope
const service = getBookService()

// Used inside all async actions
const books = await service.getBooks()
```

The store imports from `services/index.ts` only — never from `MockBookService.ts` directly.

---

## 8. Mock Data Layer Design

### MockBookService

**Storage:** localStorage via the `localStorage.adapter.ts` utility. Data survives page refresh. Seeds 5–8 sample books on first load.

**Artificial delay:** Every method calls `delay(400)` before returning. Loading states are always exercised.

**Simulated failures:** A `MOCK_FAILURE_RATE` constant (default `0`) can be set to a float 0–1. Exceeding the threshold rejects the Promise with a mock error. Built in now, costs nothing, available for QA use later.

**Seed data:**

| Title | Author | Genre |
|---|---|---|
| The Pragmatic Programmer | Hunt & Thomas | Technology |
| Dune | Frank Herbert | Science Fiction |
| Project Hail Mary | Andy Weir | Science Fiction |
| The Design of Everyday Things | Don Norman | Design |
| Atomic Habits | James Clear | Self-Help |

**Mock method behavior:**

| Method | Behavior |
|---|---|
| `getBooks()` | `delay(400)` → read from localStorage → return array |
| `addBook(input)` | `delay(400)` → generate UUID → append to storage → return new Book |
| `updateBook(id, updates)` | `delay(300)` → find by ID → merge updates → write back → return updated Book |
| `deleteBook(id)` | `delay(300)` → filter out by ID → write back → return void |

---

## 9. Data Models / TypeScript Types

### `types/book.types.ts`

```typescript
enum BookStatus {
  Unread     = 'unread',
  Read       = 'read',
  WantToRead = 'want-to-read',
}

interface Book {
  id:          string          // UUID
  title:       string
  author:      string
  coverUrl:    string | null   // URL or null for placeholder
  genre:       string | null
  pageCount:   number | null
  status:      BookStatus
  addedAt:     string          // ISO date string
  finishedAt:  string | null   // ISO date string or null
}

interface NewBookInput {
  title:     string            // required
  author:    string            // required
  coverUrl?: string
  genre?:    string
  pageCount?: number
}
```

### `types/api.types.ts` (defined in Phase 1, used in Phase 2)

```typescript
interface ApiResponse<T> {
  data:    T
  message: string
  success: boolean
}

interface ApiError {
  message:    string
  statusCode: number
  errors:     string[] | null
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page:       number
  pageSize:   number
  totalCount: number
  totalPages: number
}
```

---

## 10. Phase 2 Migration Path

### What Does NOT Change

- All React components
- All Zustand stores
- All TypeScript types
- All custom hooks
- All routing

### What Changes

1. `.env.production` — set `VITE_USE_MOCK_API=false`
2. `ApiBookService.ts` — implement each method using Axios calls to real endpoints (stubbed in Phase 1)
3. `services/index.ts` — no changes needed

### What is Added

- Express app with route handlers
- Drizzle ORM schema and migrations
- SQLite database (dev) or PostgreSQL connection string (prod)

### Migration Steps

1. Scaffold Node.js/Express project
2. Implement `GET /books` and `POST /books` first
3. Implement `ApiBookService.getBooks()` and `addBook()`, flip env var
4. Verify frontend behavior is identical
5. Implement remaining endpoints + service methods
6. Remove `VITE_USE_MOCK_API=true` from `.env.development`

---

## 11. REST API Endpoints (Phase 2)

| Method | Path | Description | Body | Response |
|---|---|---|---|---|
| GET | `/api/books` | List all books | — | `ApiResponse<Book[]>` |
| GET | `/api/books/:id` | Get single book | — | `ApiResponse<Book>` |
| POST | `/api/books` | Add a book | `NewBookInput` | `ApiResponse<Book>` 201 |
| PATCH | `/api/books/:id` | Update book fields | `Partial<Book>` | `ApiResponse<Book>` |
| DELETE | `/api/books/:id` | Delete a book | — | 204 No Content |

`PATCH` is preferred over `PUT` — marking a book as read sends only `{ status: 'read' }`.

---

## 12. Database Schema (Phase 2)

**Table: `books`**

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | UUID, server-generated |
| `title` | TEXT | NOT NULL | |
| `author` | TEXT | NOT NULL | |
| `cover_url` | TEXT | NULLABLE | |
| `genre` | TEXT | NULLABLE | |
| `page_count` | INTEGER | NULLABLE | |
| `status` | TEXT | NOT NULL, DEFAULT 'unread' | Enum enforced at app layer |
| `added_at` | TEXT | NOT NULL | ISO 8601 |
| `finished_at` | TEXT | NULLABLE | Set when status → 'read' |

**Design decisions:**
- Single table for MVP — no genres or authors tables (premature normalization)
- `status` stored as TEXT — readable, debuggable, SQLite-friendly
- No `user_id` in MVP — add as nullable column when auth is introduced; backfill with a default user ID
- Timestamps as ISO strings for JSON serialization symmetry with frontend types

---

## 13. Phased Implementation Plan

### Phase 1 — MVP

**Week 1: Foundation**
- Project scaffold (Vite + React + TypeScript + Tailwind)
- shadcn/ui setup
- React Router routes
- AppShell layout (Navbar, Sidebar)
- TypeScript types
- localStorage adapter, delay utility, ID generator

**Week 2: Core Features**
- `IBookService` interface
- `MockBookService` with seeded data and artificial delay
- Service factory
- Zustand `booksStore` + `uiStore`
- `BookCard` and `BookList` components
- `LibraryPage` wired to store
- `AddBookModal` with form validation

**Week 3: Polish**
- `ReadingListPage`
- Mark as read / toggle reading list end-to-end
- `ReadingStatusBadge`, `EmptyState`, `LoadingSpinner`
- Responsive layout
- Error state handling
- Visual polish, favicon, page titles

**Deliverable:** Fully functional SPA, mock data, behaves like a real application.

### Phase 2 — Real Backend

- Node.js + Express scaffold
- Drizzle ORM + SQLite schema + migrations
- All 5 REST endpoints
- `ApiBookService.ts` implementation
- Switch env variable, verify parity
- Deploy API + frontend

**Deliverable:** Full-stack application; mock layer remains available via env var.

### Phase 3 — Future

- User authentication (JWT or session)
- Book search (client-side filter first)
- Ratings and reading notes
- Google Books API integration
- Reading progress tracking
- Import/export as CSV or JSON
- Switch to PostgreSQL

---

## 14. Deliverables Checklist

**Phase 1 complete when:**
- [ ] Builds without TypeScript errors (`tsc --noEmit` passes)
- [ ] All three routes render without console errors
- [ ] Add book form validates required fields and submits
- [ ] New book appears in library immediately after submission
- [ ] Mark as read updates the badge without page reload
- [ ] Toggle reading list adds/removes book from ReadingList page
- [ ] Books persist after hard page refresh
- [ ] Loading spinner appears for minimum 400ms on every data operation
- [ ] Empty state renders when no books exist
- [ ] Error state renders when mock failure rate set to 1.0
- [ ] Usable on a 375px mobile viewport
- [ ] No `any` types in TypeScript

**Phase 2 complete when:**
- [ ] All Phase 1 checklist items pass with `VITE_USE_MOCK_API=false`
- [ ] API returns correct HTTP status codes
- [ ] Data persists in SQLite after server restart
- [ ] Frontend and backend deployed and publicly accessible

---

## 15. Common Mistakes / Anti-Patterns to Avoid

1. **Bypassing the service layer from components.** Never call `MockBookService` inside a React component. Components call store actions only.

2. **Synchronous mock methods.** If mock methods return synchronously (no `delay()`), loading states never render. Always simulate async.

3. **Storing derived state in the store.** `readingListBooks` is `books.filter(...)` — not a separate state field. Redundant state causes sync bugs.

4. **Calling `loadBooks()` in every component.** Call it once — in `App.tsx` or `LibraryPage` on first mount, guarded against re-fetching.

5. **Business logic in components.** The logic for "what marking a book as read means" belongs in the store action, not in a `BookCard` onClick handler.

6. **Store importing MockBookService directly.** The store imports from `services/index.ts` (the factory) only. This is the seam that makes Phase 2 possible.

7. **Using localStorage outside the adapter.** All `window.localStorage` access goes through the adapter. Never call it directly in multiple places.

8. **Making `NewBookInput` identical to `Book`.** `NewBookInput` has no `id`, `addedAt`, `status`, or `finishedAt` — those are assigned by the service. Conflating them causes type confusion.

9. **Skipping `api.types.ts` in Phase 1.** Defining `ApiResponse<T>` now costs 10 minutes and prevents a future refactor when `ApiBookService` needs to unwrap API responses.

10. **One monolithic Zustand store.** Keeping `booksStore` and `uiStore` separate keeps concerns clean. Modal state should not live next to async fetch status.

---

## 16. First 10 Implementation Tasks

**Task 1: Scaffold the project**
Run `npm create vite@latest tomekeeper -- --template react-ts`. Enable strict TypeScript (`"strict": true`, `"noImplicitAny": true`). Install and configure Tailwind CSS. Verify `npm run dev` opens a blank page with no errors.
*Done when:* `npm run dev` works and `tsc --noEmit` passes.

**Task 2: Install and configure dependencies**
Install: `react-router-dom`, `zustand`, `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`. Initialize shadcn/ui. Add Button, Card, Badge, and Dialog components.
*Done when:* A test page renders a shadcn `<Button>` without errors.

**Task 3: Define all TypeScript types**
Create `src/types/book.types.ts` with `BookStatus` enum, `Book`, and `NewBookInput`. Create `src/types/api.types.ts` with `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`.
*Done when:* `tsc --noEmit` passes with all types defined.

**Task 4: Create utility files**
Create `localStorage.adapter.ts` (typed get/set/remove). Create `delay.ts` (sleep function). Create `generateId.ts` (`crypto.randomUUID()`). Create `config/env.ts` (typed env exports). Create `.env.development` with `VITE_USE_MOCK_API=true`.
*Done when:* All utilities importable, TypeScript happy.

**Task 5: Define service interface and implement MockBookService**
Create `BookService.interface.ts`. Create `MockBookService.ts` (localStorage + delay, 5 seed books). Create `ApiBookService.ts` stub (all methods throw `Not implemented`). Create `services/index.ts` factory.
*Done when:* `MockBookService.getBooks()` returns seed data after 400ms delay.

**Task 6: Build Zustand stores**
Create `booksStore.ts` with full state shape and all five actions. Create `uiStore.ts` with modal and view mode state. All async actions follow the `idle → loading → success/error` pattern.
*Done when:* `booksStore.getState().loadBooks()` can be called from browser console and `books` populates.

**Task 7: Build the AppShell layout**
Create `AppShell.tsx`, `Navbar.tsx`, `Sidebar.tsx`. Set up React Router in `App.tsx`: `/` → redirect to `/library`, `/library`, `/reading-list`, `*` → 404. Pages are empty placeholders at this stage.
*Done when:* Navigating between `/library` and `/reading-list` works and the shell renders.

**Task 8: Build BookCard and BookList**
Create `BookCard.tsx` — renders cover, title, author, genre badge, three action buttons (Mark Read, Want to Read, Delete). Callbacks passed as props — no store imports in this component. Create `BookList.tsx` — maps books array to BookCards.
*Done when:* `BookCard` renders in isolation with a hardcoded `Book` object and all buttons are visible.

**Task 9: Wire LibraryPage to the store**
Implement `LibraryPage.tsx`. On mount call `loadBooks()`. Render spinner when `status === 'loading'`, empty state when `books` is empty, `<BookList>` otherwise. Wire `BookCard` action buttons to store actions.
*Done when:* Library page loads, shows spinner, then shows 5 seed books. "Mark as Read" updates the badge immediately.

**Task 10: Build and wire AddBookModal**
Create `AddBookModal.tsx` (shadcn Dialog). Form fields: title (required), author (required), coverUrl, genre, pageCount (all optional). On submit: call `booksStore.addBook()`, disable button during loading, close modal on success, new book appears in grid.
*Done when:* A user can open the modal, submit a new book, and see it appear in the library after the 400ms mock delay.

---

*After Task 10, the core MVP loop is functional. Remaining work: ReadingListPage, responsive layout, error state handling, and visual polish — all following the same patterns established above.*
