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
