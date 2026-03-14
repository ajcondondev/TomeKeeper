# TomeKeeper — Scaffold Notes

## What was built

Phase 1 scaffold, completed 2026-03-14.

All foundation files are in place. The app builds cleanly and `tsc --noEmit` passes with zero errors.

---

## Deviations from the Architecture Blueprint

### 1. `BookStatus` — const object instead of enum

**Blueprint said:** `enum BookStatus`

**Actual:** `const BookStatus` + `type BookStatus` union

**Reason:** `tsconfig.app.json` has `"erasableSyntaxOnly": true` (TypeScript 5.9+), which disallows regular enums because they require runtime code generation. The const object pattern is identical in usage (`BookStatus.Read`, `BookStatus.WantToRead`) and is the recommended modern replacement.

### 2. Custom UI components instead of shadcn/ui CLI

**Blueprint said:** Initialize shadcn/ui via CLI

**Actual:** `Button`, `Badge`, `Card` written manually in `src/components/ui/`

**Reason:** The shadcn `init` CLI is interactive and incompatible with scripted setup. The manually written components follow the same patterns (Tailwind classes, `cn` utility, typed props) and are fully replaceable with shadcn-generated versions when needed. `Dialog` is not yet needed — it will be added in the next prompt for `AddBookModal`.

### 3. Tailwind CSS v4 setup

**Blueprint mentioned** `tailwind.config.ts`

**Actual:** No config file — Tailwind v4 uses `@tailwindcss/vite` plugin + `@import "tailwindcss"` in CSS. Auto-detection handles content scanning. Config file only needed if custom design tokens are required later.

### 4. `--legacy-peer-deps` for installation

`@tailwindcss/vite@4.x` peer deps don't yet declare support for `vite@8`. Installing with `--legacy-peer-deps` resolved this with no functional impact.

---

## Files Created

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── config/
│   └── env.ts
├── types/
│   ├── book.types.ts
│   └── api.types.ts
├── lib/
│   ├── utils.ts
│   ├── localStorage.adapter.ts
│   ├── delay.ts
│   └── generateId.ts
├── services/
│   ├── BookService.interface.ts
│   ├── MockBookService.ts       ← seeds 5 books, 400ms delay, MOCK_FAILURE_RATE
│   ├── ApiBookService.ts        ← Phase 2 stub
│   └── index.ts                 ← factory: getBookService()
├── store/
│   ├── booksStore.ts            ← full action set, idle/loading/success/error
│   └── uiStore.ts               ← modal state, view mode
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── badge.tsx
│   │   └── card.tsx
│   ├── Layout/
│   │   ├── AppShell.tsx
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── LoadingSpinner.tsx
│   └── EmptyState.tsx
└── pages/
    ├── LibraryPage.tsx          ← placeholder
    ├── ReadingListPage.tsx      ← placeholder
    └── NotFoundPage.tsx
```

---

## What is Ready for Next Prompt

The service layer, stores, and all infrastructure are fully implemented — not stubbed.
`MockBookService` is real and functional. `booksStore` has all 5 actions wired.

Only the **page and component UI** are placeholders. The next prompt should implement:

- `BookCard` and `BookList` components
- Wire `LibraryPage` to `booksStore` (loading/empty/populated states)
- `AddBookModal` with form + validation
- `ReadingListPage` as a filtered view
- `ReadingStatusBadge` component
- Responsive layout polish
