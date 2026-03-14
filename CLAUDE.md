# TomeKeeper — Claude Code Instructions

## Project Overview

TomeKeeper is a book tracking web application with automated end-to-end testing using Playwright.

---

## Git / GitHub Workflow (MANDATORY)

Git and GitHub usage is **required** throughout this project. Follow these rules at all times:

### Commit discipline
- Make **small, logical, atomic commits** — one concern per commit.
- Never make large, messy "catch-all" commits.
- Commit after every meaningful milestone (new feature, test suite, config change, doc output).
- Use clean commit message **prefixes**:
  - `chore:` — tooling, config, dependencies, repo setup
  - `feat:` — new application features or pages
  - `fix:` — bug fixes
  - `refactor:` — code restructuring with no behavior change
  - `test:` — test files, fixtures, helpers
  - `docs:` — markdown documents, README, planning artifacts

### Example commit messages
```
chore: initialize TomeKeeper project
docs: add CLAUDE.md workflow rules
docs: add architecture blueprint
feat: add library page
feat: add mock book service
test: add starter Playwright smoke test
refactor: simplify book form state handling
```

### Push cadence
- Push to GitHub **regularly** so the remote stays current.
- Treat the GitHub repository as the **source of truth** for project progress.
- The project must never exist only on a local machine — push after meaningful work.

### Reverting changes
- Because all work is committed atomically, any change can be safely reverted.
- Prefer `git revert` over destructive operations like `git reset --hard` unless explicitly requested.

---

## Saved Outputs Policy

All important non-code outputs **must be saved as markdown files** in the repository.
Do not leave them only in terminal/chat history.

### Where to save outputs
Use the `docs/` folder for all structured documents:

| Output type | Example filename |
|-------------|-----------------|
| Architecture blueprint | `docs/architecture-blueprint.md` |
| Project overview | `docs/project-overview.md` |
| Phase plan | `docs/phase-1-plan.md` |
| Testing strategy | `docs/testing-strategy.md` |
| Session notes | `docs/session-001-notes.md` |
| Setup instructions | `docs/setup-instructions.md` |
| Workflow notes | `docs/workflow-notes.md` |

### Rules for saved outputs
- Create a **separate file per distinct deliverable**.
- Use **clear, descriptive filenames** in kebab-case.
- Update an existing file when adding to the same document.
- Create a new file when the output is a distinct new deliverable.
- Commit and push markdown files just like code.

---

## Development Standards

- Keep code simple and focused — avoid over-engineering.
- Do not add features beyond what is explicitly requested.
- Prefer editing existing files over creating new ones unless a new file is clearly warranted.
- Do not add comments or docstrings unless logic is non-obvious.

---

## Testing Standards

- All automated tests use **Playwright**.
- Tests live in the `tests/` directory.
- Tests must be deterministic and isolated — no shared mutable state between tests.
- Use Page Object Model (POM) for any non-trivial page interactions.
- Test names should clearly describe the behavior under test.
