# TomeKeeper

> A personal book tracking web app

[![Smoke Tests](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright.yml/badge.svg)](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright.yml)
[![Nightly Regression](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright-nightly.yml/badge.svg)](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright-nightly.yml)

---

## What is TomeKeeper?

TomeKeeper is a full-stack web app for tracking your reading. It serves two purposes: a functional book tracker, and a real-world codebase with a comprehensive Playwright E2E test suite built alongside the app.

The testing side covers functional E2E, REST API contract testing, accessibility audits, visual regression, and mobile viewport testing — across Chromium, Firefox, and WebKit — with a smoke gate on every push and a nightly full regression run.

---

## Features

- **Accounts** — email/password auth; each user has a private library
- **Library** — add books with title, author, genre, page count, and cover image
- **Cover art** — auto-fetch from Open Library by title and author
- **Reading status** — mark books as Read / Unread / Want to Read
- **Reading List** — filtered view of your want-to-read books
- **Reviews** — write, edit, and delete reviews for any book in your library
- **Responsive** — full mobile layout with tab bar navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Zustand |
| Backend | Node.js, Express 5, express-session |
| Database | SQLite (better-sqlite3), Drizzle ORM |
| Testing | Playwright, axe-core, @faker-js/faker |

---

## Project Structure

```
TomeKeeper/
├── src/                    # React frontend
│   ├── pages/              # Route-level page components
│   ├── components/         # Shared UI components
│   ├── store/              # Zustand state (books, reviews, auth, UI)
│   └── services/           # API service layer (real + mock implementations)
├── server/                 # Express backend
│   ├── routes/             # Route definitions
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, error handling
│   └── db/                 # Drizzle schema and migrations
├── e2e/                    # Playwright test suite
│   ├── tests/              # Spec files organised by feature/type
│   │   ├── auth/           # Login, registration, session, route protection
│   │   ├── library/        # Book CRUD, cover art, empty states
│   │   ├── reading-list/   # Reading list management
│   │   ├── reviews/        # Review CRUD
│   │   ├── api/            # REST API contract tests
│   │   ├── accessibility/  # axe-core WCAG audits
│   │   ├── visual/         # Screenshot regression
│   │   └── mobile/         # Mobile viewport tests
│   ├── pages/              # Page Object Models
│   ├── components/         # Component Object Models
│   ├── fixtures/           # Playwright test fixtures
│   └── utils/              # ApiHelper, TestDataFactory
└── .github/workflows/      # CI — smoke gate + nightly regression
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Install

```bash
npm install
```

---

## Running the App

### Option A — Mock mode (no backend needed)

Set `.env.development`:

```
VITE_USE_MOCK_API=true
```

```bash
npm run dev
```

Data lives in `localStorage`. Three seed books load on first visit. Good for UI work without spinning up a server.

---

### Option B — Real API mode

Set `.env.development`:

```
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3001
```

Start both servers (two terminals):

```bash
# Terminal 1 — Express API
npm run server:dev

# Terminal 2 — Vite frontend
npm run dev
```

The backend creates `data/tomekeeper.db` on first run and applies all migrations automatically. Register an account on the login page to get started.

> **Fresh install note:** if you're upgrading from a version without auth, delete `data/tomekeeper.db` so it can be recreated with the new schema.

---

## E2E Tests

The test suite is in `e2e/` and requires the app running in **real API mode** (both servers). Copy `e2e/.env.example` to `e2e/.env` — the defaults match the dev server ports.

### Test types

| Type | Location | Description |
|---|---|---|
| Functional E2E | `tests/auth/`, `tests/library/`, etc. | User journey tests through the browser |
| API contract | `tests/api/` | Direct HTTP tests against the REST API |
| Accessibility | `tests/accessibility/` | axe-core WCAG 2.1 AA audits |
| Visual regression | `tests/visual/` | Screenshot comparison (Chromium only) |
| Mobile viewport | `tests/mobile/` | Layout and interaction at 390×844 (iPhone 14) |

### Tag system

Tests are tagged so you can target specific tiers:

| Tag | What it selects |
|---|---|
| `@smoke` | Critical path — fast CI gate, ~26 tests |
| `@regression` | Full functional suite — all important scenarios |
| `@security` | Auth and session security properties |
| `@edge` | Edge cases and unusual paths |

### Common commands

```bash
# Run all tests (from e2e/)
npx playwright test

# Smoke tests only — fast local check
npx playwright test --grep @smoke

# Full regression suite
npx playwright test --grep @regression

# Single browser
npx playwright test --project=chromium

# Visible browser
npx playwright test --headed

# Specific file
npx playwright test tests/library/library-crud.spec.ts

# View last report
npx playwright show-report
```

### CI

| Workflow | Trigger | Scope |
|---|---|---|
| **Smoke gate** | Every push and pull request | `@smoke` tests, Chromium only |
| **Nightly regression** | 2 AM UTC, or manual dispatch | Full suite, Chromium + Firefox + WebKit |

HTML reports and traces are uploaded as artifacts on failure.
