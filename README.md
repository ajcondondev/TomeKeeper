<div align="center">

# 📚 TomeKeeper

**A personal book tracking web app — and a full QA automation portfolio project.**

[![Smoke Tests](https://github.com/ajcondondev/TomeKeeper/workflows/Playwright%20Smoke%20Tests/badge.svg)](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright.yml)
[![Nightly Regression](https://github.com/ajcondondev/TomeKeeper/workflows/Playwright%20Nightly%20Regression/badge.svg)](https://github.com/ajcondondev/TomeKeeper/actions/workflows/playwright-nightly.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Playwright](https://img.shields.io/badge/Playwright-1.58-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 🧭 What is TomeKeeper?

TomeKeeper is a full-stack web app for tracking your reading. It serves two purposes: a functional book tracker, and a real-world codebase with a comprehensive Playwright E2E test suite built alongside the app.

The testing side covers functional E2E, REST API contract testing, accessibility audits, visual regression, and mobile viewport testing — across Chromium, Firefox, and WebKit — with a smoke gate on every push and a nightly full regression run.

---

## ✨ Features

| Feature | Detail |
|:--------|:-------|
| **Accounts** | Email/password auth — each user has a private library |
| **Library** | Add books with title, author, genre, page count, and cover image |
| **Cover art** | Auto-fetched from Open Library by title and author |
| **Reading status** | Mark books as Read / Unread / Want to Read |
| **Reading List** | Filtered view of your want-to-read books |
| **Reviews** | Write, edit, and delete reviews for any book in your library |
| **Responsive** | Full mobile layout with tab bar navigation |

---

## 🛠️ Tech Stack

| Layer | Technology | Detail |
|:------|:-----------|:-------|
| Frontend | React 19, TypeScript, Vite | Component UI, type safety, fast builds |
| Styling | Tailwind CSS | Utility-first, responsive layout |
| State | Zustand | Lightweight global state management |
| Backend | Node.js, Express 5 | REST API server |
| Session | express-session | Cookie-based auth sessions |
| Database | SQLite (better-sqlite3) | Embedded file-based DB |
| ORM | Drizzle ORM | Type-safe schema and migrations |
| Testing | Playwright | E2E, API, visual, a11y, mobile |
| Test data | @faker-js/faker | Randomised realistic test fixtures |
| A11y | axe-core | WCAG 2.1 AA automated audits |

---

## 🗺️ Architecture

```
┌──────────────────────────┐          ┌──────────────────────────┐
│       Browser / UI       │   HTTP   │       Express 5 API       │
│  React 19 · Tailwind CSS │◄────────►│  Routes · Controllers    │
│  Zustand · React Router  │          │  Middleware · Sessions   │
│        Port 5173         │          │        Port 3001         │
└──────────────────────────┘          └────────────┬─────────────┘
          ▲                                         │
          │ Playwright                         Drizzle ORM
          │ (Chromium · Firefox · WebKit)           │
          │                                         ▼
┌─────────┴────────────────┐          ┌──────────────────────────┐
│   E2E · API · A11y       │          │      SQLite Database      │
│   Visual · Mobile        │          │   data/tomekeeper.db     │
└──────────────────────────┘          └──────────────────────────┘
```

---

## 📁 Project Structure

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
│   ├── tests/              # Specs organised by feature / type
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
│   └── utils/              # ApiHelper · TestDataFactory
└── .github/workflows/      # CI — smoke gate + nightly regression
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version |
|:------------|:--------|
| Node.js | 22+ |
| npm | bundled with Node |

### Install

```bash
npm install
```

---

## ▶️ Running the App

### Option A — Mock mode (no backend needed)

Set `.env.development`:

```env
VITE_USE_MOCK_API=true
```

```bash
npm run dev
```

> [!NOTE]
> Mock mode stores data in `localStorage`. Three seed books load on first visit. Good for UI work without spinning up a server.

---

### Option B — Real API mode

Set `.env.development`:

```env
VITE_USE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3001
```

Start both servers in two terminals:

```bash
# Terminal 1 — Express API
npm run server:dev

# Terminal 2 — Vite frontend
npm run dev
```

The backend creates `data/tomekeeper.db` on first run and applies all migrations automatically. Register an account on the login page to get started.

> [!IMPORTANT]
> **Fresh install:** if you're upgrading from a version without auth, delete `data/tomekeeper.db` so it can be recreated with the new schema.

---

## 🧪 E2E Tests

The test suite lives in `e2e/` and requires the app running in **real API mode** (both servers). Copy `e2e/.env.example` to `e2e/.env` — the defaults match the dev server ports.

### Test types

| Type | Location | What it tests |
|:-----|:---------|:--------------|
| Functional E2E | `tests/auth/`, `tests/library/`, etc. | User journeys through the browser |
| API contract | `tests/api/` | Direct HTTP tests against the REST API |
| Accessibility | `tests/accessibility/` | axe-core WCAG 2.1 AA audits |
| Visual regression | `tests/visual/` | Screenshot comparison (Chromium only) |
| Mobile viewport | `tests/mobile/` | Layout and interaction at 390×844 (iPhone 14) |

### Tag system

```
@smoke       ──  Critical path · fast CI gate · ~26 tests
@regression  ──  Full functional suite · all important scenarios
@security    ──  Auth and session security properties
@edge        ──  Edge cases and unusual paths
```

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

> [!TIP]
> Run `npx playwright test --repeat-each=3` to check for flaky tests before committing.

### CI

| Workflow | Trigger | Browsers | Scope |
|:---------|:--------|:---------|:------|
| **Smoke gate** | Every push and pull request | Chromium | `@smoke` tests only |
| **Nightly regression** | 2 AM UTC · manual dispatch | Chromium + Firefox + WebKit | Full suite |

HTML reports and traces are uploaded as artifacts on failure.

---

<div align="center">

Built with [Playwright](https://playwright.dev/) · [React](https://react.dev/) · [Express](https://expressjs.com/) · [SQLite](https://www.sqlite.org/) · [Vite](https://vitejs.dev/)

</div>
