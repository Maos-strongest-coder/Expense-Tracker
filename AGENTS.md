# AGENTS.md — Expense Tracker

## Goal
Track expenses and give spending insight. Scope is fixed — no features beyond **Features**; ask before adding anything.

## Features
CRUD expenses; 4 categories (food, transport, entertainment, other); filter by category; sort by date/amount asc/desc;
dashboard (total of ALL expenses + per-category breakdown); real-time form validation; LocalStorage persistence; UX polish.

## Commands
`npm run dev` · `npm run build` · `npm run test` (vitest run) · `npm run test:watch` · `npm run lint` (eslint .) · `npm run typecheck` (`vue-tsc -b` — plain `--noEmit` checks nothing on this solution-style tsconfig).
Never claim test/lint/typecheck pass without running them and pasting real output.

## Data model
`Expense { id: UUID; description: string; amountCents: integer; category: Category; date: 'YYYY-MM-DD'; createdAt: ISO; updatedAt?: ISO }` — all types in `src/types.ts`, imported with `import type` (incl. `import type { Category } from './categories'`).
`enum Category { Food = 'food', Transport = 'transport', Entertainment = 'entertainment', Other = 'other' }`, `CATEGORIES: readonly { id: Category; label: string; color: string }[]` and `isCategory(v: unknown): v is Category` are exported from `src/categories.ts` — one CATEGORIES entry per member (labels Food/Transport/Entertainment/Other); CATEGORIES feeds form, filter and dashboard.
Membership checks use `Object.values(Category)`; stored JSON holds the string values, tests use `Category.Food`.
`SortField` `'date'|'amount'`, `SortOrder` `'asc'|'desc'` — string-literal unions, not enums. `CategoryFilter` = `Category|'all'`; `FilterOptions { category: CategoryFilter; sortField: SortField; sortOrder: SortOrder }`.
`ExpenseInput` = `Omit<Expense,'id'|'createdAt'|'updatedAt'>`; `ExpenseDraft { description: string; amount: string; category: Category | null; date: string }`; `FormErrors` = `Partial<Record<keyof ExpenseDraft,string>>`; `ValidationResult = { ok: true; value: ExpenseInput } | { ok: false; errors: FormErrors }`; `CategorySummary { category; label; color?; totalCents; count; sharePercent: number }`; `StoredPayload { version: 1; expenses }`.
State stores integer cents only.

## Architecture
- Composables, one job each: `useLocalStorage`, `useExpenses`, `useExpenseFilters`, `useExpenseSummary`, `useExpenseForm`, `useConfirmDialog`, `useToasts`.
- `useExpenses()` is called once in `App.vue`; other composables receive its list as an argument (single source of truth).
- Pure logic in `src/utils/` (validation, cents parsing/formatting, sorting, date checks, stored-payload parsing) — no DOM, no storage, unit tested.
- Components get data via props and emit events. Containers: `App.vue` and `ExpenseForm.vue`; all others presentational.
- Tests co-located as `src/**/*.test.ts` (vitest + happy-dom env in `vite.config.ts`); component names must be multi-word (`vue/essential`).
- Only `useLocalStorage` touches localStorage. No Pinia, no UI libraries, no new deps without asking.

## Validation
description: required, trimmed 2–120. amount: required, `12`/`12,34`/`12.34` → integer cents; a lone dot (`'1.234'`) is rejected as ambiguous; `'1.234,56'` is valid; > 0 and ≤ 100000000.
category: required, a `Category` member (`Object.values(Category)`), no default. date: strict `YYYY-MM-DD`, real calendar date, ≥ 2000-01-01, not in the future (local tz).
Timing: untouched = silent; blur validates; once invalid, live on input; submit validates all, shows all, focuses first invalid. Re-validate everything loaded from localStorage.

## Storage
Key `expense-tracker:v1`, shape `StoredPayload`. Missing key → empty. Parse/shape/version≠1 → status `'corrupt'`, discard, start empty (no overwrite until first mutation); AlertBanner shows 'saved data unreadable'. Invalid single record → drop it, keep rest; AlertBanner shows 'N entries skipped' when dropped > 0.
Write fails (quota/private mode) → in-memory state wins, persistent `role="alert"` banner, retry on every mutation, hide banner once a write succeeds.

## Behavior rules
Filter first, then sort (default date desc); tie-breaker: equal keys → `createdAt` asc. Dashboard ignores filter/sort.
Mutations update the in-memory list first (optimistic), then persist — storage is synchronous, so there is no loading state. The visible list is a `computed` (filter → sort) keyed by `expense.id`, no watchers for derived data; it must stay fast with ~1000 expenses.
Empty state ("no expenses yet" + CTA) ≠ no-results ("clear filters"). Edit prefills; save updates `updatedAt`, keeps id/createdAt; cancel = no change.
After a successful add the form resets; after a save it leaves edit mode. If a saved item is hidden by the active filter, a toast says so. Delete only via confirm dialog (ESC/backdrop/Cancel abort).
Save stays enabled in create mode (so submit can show all errors and focus the first invalid field); in edit mode it is disabled while the form is not dirty. Format `Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'})` on `amountCents/100`; total 0 → `€ 0,00`, never NaN/empty.

## UX & accessibility
Disabled: filter/sort when list empty, Save in edit mode when not dirty. Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, initial focus on Cancel, ESC/backdrop close, focus restored.
Fields: visible `<label for>`, `aria-invalid` + `aria-describedby`, `fieldset`/`legend` for radios. Failure banner `role="alert"`.
Toasts: one `aria-live="polite"` region, ≤ 3, auto-dismiss ~4s, close button. Keyboard-only: native elements, no positive tabindex, visible focus rings.

## Boundaries
`strict: true` stays. No `any` (use `unknown` + narrow), no `@ts-expect-error`/`@ts-ignore` escapes, no deps without asking, no features beyond **Features**, never claim green checks you didn't run. JSON.parse result is assigned to `unknown`; type guards, never `as` casts to bypass narrowing.

## Build order
Follow tasks.md, one phase at a time. Per phase: plan (complex tasks) → build → run gates → reflect → update AGENTS.md if a decision changed. Stop after each phase, paste real test/typecheck/lint output, wait for OK.
