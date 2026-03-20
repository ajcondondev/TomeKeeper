# TomeKeeper

A personal book tracking web app. Add books to your library, mark them as read, and maintain a reading list.

---

## Features

- Email/password accounts — each user has their own private library
- View your book library in a responsive grid
- Add books with title, author, genre, page count, and cover image
- Auto-fetch cover art from Open Library
- Mark books as read/unread
- Add/remove books from a "Want to Read" list
- Reading List page filtered to your want-to-read books
- Write, edit, and delete book reviews

---

## Running the app

### Option A — Mock mode (no backend needed)

Set `.env.development`:
```
VITE_USE_MOCK_API=true
```

Then start the frontend:
```bash
npm run dev
```

Data is stored in your browser's localStorage. Three seed books load on first visit.

---

### Option B — Real API mode (backend + frontend)

Set `.env.development`:
```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3001
```

Open two terminals:

**Terminal 1 — backend**
```bash
npm run server:dev
```

**Terminal 2 — frontend**
```bash
npm run dev
```

The backend creates `data/tomekeeper.db` (SQLite) automatically on first run and runs all migrations.

**First time setup:** Open the app and click "Create one" on the login page to register an account. Each account has its own private book library.

> **Upgrading from a pre-auth version?** The database schema changed to add user accounts. Delete `data/tomekeeper.db` before starting the server so it can be recreated with the new schema.

---

## Switching modes

Edit `.env.development` and restart `npm run dev`:

| Mode | `VITE_USE_MOCK_API` |
|---|---|
| Mock (localStorage) | `true` |
| Real API (SQLite) | `false` |

---

## Where data is stored

| Mode | Storage |
|---|---|
| Mock | Browser localStorage (`tomekeeper:books`) |
| Real API | `data/tomekeeper.db` (SQLite, local file) |

---

## E2E Tests

The project has a Playwright test suite covering authentication, library CRUD, reading list, and reviews.

**Run all tests:**
```bash
cd e2e
npx playwright test
```

**Run smoke tests only:**
```bash
npx playwright test --grep @smoke
```

**Run with visible browser:**
```bash
npx playwright test --headed
```

Tests require the app to be running in real API mode. Copy `e2e/.env.example` to `e2e/.env` and adjust `BASE_URL` / `API_URL` if your ports differ from the defaults.

### CI

- **Smoke gate** — runs on every push and pull request (Chromium only)
- **Nightly regression** — runs at 2 AM UTC across Chromium, Firefox, and WebKit
