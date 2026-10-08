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
- Components get data via props and emit events. Containers: `App.vue` and `ExpenseForm.vue`; all others presentational. `CategoryFilter.vue` uses `v-model` (`modelValue`/`update:modelValue`), `SortControls.vue` uses `field`/`order` props with `update:field`/`update:order`.
- Composable refs must be bound at top level in templates (destructured in `App.vue`): refs nested inside a plain object are not unwrapped in templates, so `v-model="filters.category"` would silently desync — use `v-model="category"` instead.
- Tests co-located as `src/**/*.test.ts` (vitest + happy-dom env in `vite.config.ts`); component names must be multi-word (`vue/essential`). Mount with explicit generics (`mount<typeof Comp, typeof Comp>(...)`) so emits/props typing infers. To force a storage write failure, spy on `window.localStorage.setItem` (the instance) — not `Storage.prototype`, happy-dom's storage can expose own methods that shadow it.
- Only `useLocalStorage` touches localStorage. No Pinia, no UI libraries, no new deps without asking.

## Validation
description: required, trimmed 2–120. amount: required, `12`/`12,34`/`12.34` → integer cents; a lone dot (`'1.234'`) is rejected as ambiguous; `'1.234,56'` is valid; > 0 and ≤ 100000000. An optional leading `€` (the form's own edit-prefill format) is stripped before parsing.
category: required, a `Category` member (`Object.values(Category)`), no default. date: strict `YYYY-MM-DD`, real calendar date, ≥ 2000-01-01, not in the future (local tz).
The amount field filters input to digits/`,`/`.` only (a leading `€` is kept and normalized to `€ ` + digits) — letters never reach the draft; ambiguity (`'1.234'`) is still caught by validation.
Timing: untouched = silent; blur validates; once invalid, live on input; submit validates all, shows all, focuses first invalid. Re-validate everything loaded from localStorage.
Dirty check (`useExpenseForm.isDirty`) compares draft vs baseline with the amount's `€` prefix normalized away — the edit prefill uses `formatCents` (`'€ 12,34'`) while typed input is `'12,34'`, so reverting an amount edit must re-disable Save.

## Storage
Key `expense-tracker:v1`, shape `StoredPayload`. Missing key → empty. Parse/shape/version≠1 → status `'corrupt'`, discard, start empty (no overwrite until first mutation); AlertBanner shows 'saved data unreadable'. Invalid single record → drop it, keep rest; AlertBanner shows 'N entries skipped' when dropped > 0.
Write fails (quota/private mode) → in-memory state wins, persistent `role="alert"` banner, retry on every mutation, hide banner once a write succeeds.

## Behavior rules
Filter first, then sort (default date desc); tie-breaker: equal keys → `createdAt` in the same direction as the primary sort, then `id` asc. Dashboard ignores filter/sort.
Mutations update the in-memory list first (optimistic), then persist — storage is synchronous, so there is no loading state. The visible list is a `computed` (filter → sort) keyed by `expense.id`, no watchers for derived data; it must stay fast with ~1000 expenses.
Empty state ("no expenses yet" + CTA) ≠ no-results ("clear filters"). Edit prefills; save updates `updatedAt`, keeps id/createdAt; cancel = no change.
After a successful add the form resets; after a save it leaves edit mode. If a saved item is hidden by the active filter, a toast says so. Delete only via confirm dialog (ESC/backdrop/Cancel abort).
Reset/prefill/cancel are implemented by force-remounting `ExpenseForm` in `App.vue` via `:key` (`edit-${id}` vs `create-${formVersion}`) — don't mutate form state from the outside instead.
Save stays enabled in create mode (so submit can show all errors and focus the first invalid field); in edit mode it is disabled while the form is not dirty. Format `Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'})` on `amountCents/100`; total 0 → `€ 0,00`, never NaN/empty. Dashboard `sharePercent` = 1 decimal (`Math.round(x*1000)/10`), guarded to 0 when the total is 0.

## UX & accessibility
Disabled: filter/sort when list empty, Save in edit mode when not dirty. Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap, initial focus on Cancel, ESC/backdrop close, focus restored.
Fields: visible `<label for>`, `aria-invalid` + `aria-describedby`, `fieldset`/`legend` for radios. Failure banner `role="alert"`.
Toasts: one `aria-live="polite"` region, ≤ 3, auto-dismiss ~4s, close button. Keyboard-only: native elements, no positive tabindex, visible focus rings.

## Boundaries
`strict: true` stays. No `any` (use `unknown` + narrow), no `@ts-expect-error`/`@ts-ignore` escapes, no deps without asking, no features beyond **Features**, never claim green checks you didn't run. JSON.parse result is assigned to `unknown`; type guards, never `as` casts to bypass narrowing.

## Build order
Follow tasks.md, one phase at a time. Per phase: plan (complex tasks) → build → run gates → reflect → update AGENTS.md if a decision changed. Stop after each phase, paste real test/typecheck/lint output, wait for OK.
