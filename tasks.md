# tasks.md — Expense Tracker

Rules: each task is 1–4 h and has a testable "Done when". A task counts as done only when
`npm run test`, `npm run typecheck` and `npm run lint` are green for it. After every phase:
run all gates, paste the real output, wait for OK (AGENTS.md). Phases run in order.
For the complex tasks (3.2b, 3.5a, 4.1) first post a short plan (state updates, computed props,
where validation lives, edge cases) and wait for OK before coding.

## Phase 0 — Tooling (dependencies first)
- [ ] 0.1 Install `vitest` + `happy-dom`; add `test`/`test:watch` scripts; `test` block in vite.config.ts.
      Done when: `npm run test` exits 0 (prove harness with a throwaway spec, then delete it).
- [ ] 0.2 Install `@vue/test-utils`; component-test env wired to happy-dom.
      Done when: a spec `mount()`s a dummy SFC and asserts its rendered text.
- [ ] 0.3 Install `eslint`, `typescript-eslint`, `eslint-plugin-vue`, `globals`; flat `eslint.config.js`; `lint` script;
      explicitly enable `vue/html-button-has-type` (not in the recommended preset); do not add an enum ban (`Category` is an enum).
      Done when: `npm run lint` exits 0; a planted `any` and a planted `<button>` without type are both reported, then removed.
- [ ] 0.4 Add `typecheck` script (`vue-tsc -b`); verify `tsconfig.app.json` does not set `erasableSyntaxOnly: true` —
      if it does, set it to false (the codebase uses a real enum).
      Done when: exits 0 on clean code; a planted type error makes it exit non-zero, then removed; a throwaway `enum`
      compiles under `npm run typecheck`, then is removed.
- [ ] 0.5 **Phase 0 test task** — run `test` + `typecheck` + `lint` + `build`, paste output, wait for OK.
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 1 — Types + pure utils
- [ ] 1.1 `src/categories.ts`: `enum Category { Food = 'food', Transport = 'transport', Entertainment = 'entertainment', Other = 'other' }`
      plus `CATEGORIES: readonly { id: Category; label: string; color: string }[]` — one entry per member,
      labels Food/Transport/Entertainment/Other; also `isCategory(v: unknown): v is Category`.
      Done when: a spec asserts the 4 enum values in order, that every `Category` member has exactly one `CATEGORIES` entry,
      and that `isCategory` accepts each member and rejects everything else (validation and storage parsing both use it).
- [ ] 1.2 `src/types.ts`: Expense, ExpenseInput, ExpenseDraft, FormErrors, SortField, SortOrder, CategoryFilter, FilterOptions,
      CategorySummary, StoredPayload — `import type` only (incl. `import type { Category } from './categories'`).
      `ExpenseDraft { description: string; amount: string; category: Category | null; date: string }`;
      `FormErrors = Partial<Record<keyof ExpenseDraft, string>>`;
      `ValidationResult = { ok: true; value: ExpenseInput } | { ok: false; errors: FormErrors }`.
      Done when: typecheck green; no `any` anywhere (lint enforced).
- [ ] 1.3 `utils/money.ts` — `parseAmountToCents(raw: string): number | null`, syntax only: trims, accepts `12`, `12,34`, `12.34`,
      `1.234,56`, optional leading `-`, max 2 decimals; builds cents from integer/fraction strings (never `parseFloat(...)*100`).
      Range rules (> 0, ≤ 100000000) move to 1.6.
      Done when: tests — valid: `'12'→1200`, `'12,34'→1234`, `'12.34'→1234`, `'1.234,56'→123456`, `' 12,34 '→1234`, `'0.29'→29`,
      `'19.99'→1999`, `'1000000'→100000000`, `'-5'→-500`, `'0'→0`; null: `''`, `'abc'`, `'12.'`, `'1.234'`, `'1,234.56'`, 3 decimals.
- [ ] 1.4 `utils/money.ts` — `formatCents(cents: number): string` with a module-level `Intl.NumberFormat` instance (nl-NL EUR;
      Intl inserts a non-breaking space after `€`); non-finite → `'€\u00a00,00'`.
      Done when: tests: `0 → '€\u00a00,00'`, `1234 → '€\u00a012,34'`, `NaN` and `Infinity → '€\u00a00,00'` (never empty) —
      compare against `'€\u00a0…'` strings (or normalize via a helper), never a normal space.
- [ ] 1.5 `utils/dates.ts` — `todayLocalISO`, `isCalendarDate`, `isFutureDate`, min date 2000-01-01;
      pin `TZ=Europe/Amsterdam` via Vitest `globalSetup`.
      Done when: tests: `new Date(2026, 9, 7).getTimezoneOffset() === -120`; `'2026-02-30'` invalid;
      clock set to `new Date(2026, 9, 7, 0, 30)` → `todayLocalISO()` returns `'2026-10-07'`
      (the buggy `toISOString().slice(0,10)` would return the 6th); tomorrow future; `'1999-12-31'` below min.
- [ ] 1.6 `utils/validation.ts` — `validateExpense(draft: ExpenseDraft): ValidationResult` + `validateField`.
      Amount messages: `''` → required; `null` from `parseAmountToCents` → valid amount, max 2 decimals;
      ≤ 0 → greater than 0; > 100000000 → too large.
      Done when: one test per message (amount, description 2–120 trimmed, category membership via `isCategory`, date) +
      `ValidationResult` shape asserted.
- [ ] 1.7 `utils/sorting.ts` — `compareExpenses` + `sortExpenses` (returns a new array via `[...list].sort`).
      Done when: tests for date/amount × asc/desc (4 cases); dates compared as strings; input array unchanged;
      tie-break = `createdAt` in the same direction as the primary sort, then `id`.
- [ ] 1.8 `utils/storage.ts` — `parseStoredPayload(raw: string | null): { expenses: Expense[]; status: 'ok' | 'empty' | 'corrupt'; dropped: number }`
      (pure, no localStorage, no console calls); `const data: unknown = JSON.parse(raw)` inside try/catch;
      narrow with type guards (`isExpense`, `isCategory`), no `as` casts.
      Done when: tests assert status/dropped — corrupt JSON, `version≠1`, wrong shape → `'corrupt'`, 0 kept;
      1-of-3 invalid records → `'ok'`, 2 kept, `dropped: 1`; all-valid roundtrip.
- [ ] 1.9 **Phase 1 test task** — full gates, paste output, wait for OK.
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 2 — State (composables)
- [ ] 2.1 `useLocalStorage`: init from `expense-tracker:v1`, `save()`, `writeFailed` ref, storage-event handler (injectable for tests).
      Done when: tests with fake Storage: empty/valid/corrupt load; save writes `{version:1,expenses}`; throwing `setItem` → `writeFailed=true`, next successful retry → `false`.
- [ ] 2.2 `useExpenses`: `create` (crypto.randomUUID + createdAt), `update` (sets updatedAt, keeps id/createdAt), `remove`; every mutation calls save.
      Done when: CRUD tests incl. timestamps and a save-call assertion per mutation.
- [ ] 2.3 `useExpenseForm`: draft, touched, errors, validate-on-blur / live-once-invalid / all-on-submit, dirty flag, first-invalid target.
      Done when: tests cover all 4 timing rules; dirty is false until the first change.
- [ ] 2.4 `useConfirmDialog`: `open(...)` → promise; confirm/cancel resolve; resets after close.
      Done when: tests: resolve(true) on confirm, resolve(false) on cancel, closed state reset.
- [ ] 2.5 `useToasts`: `push` capped at 3, manual dismiss, 4 s auto-dismiss (fake timers).
      Done when: tests for cap, timer, and manual close.
- [ ] 2.6 **Phase 2 test task** — full gates, paste output, wait for OK.
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 3 — CRUD UI
- [ ] 3.1 `App.vue` shell (header, dashboard/form/list placeholders) + base CSS.
      Done when: component test mounts App and finds the header; gates green.
- [ ] 3.2a `ExpenseForm.vue` markup: `<label for>` on every field, category radios in `fieldset`/`legend`,
      `aria-invalid` + `aria-describedby` rendering.
      Done when: tests: every field has a matching `<label for>`, radios sit in a fieldset with a legend, and an
      invalid field renders `aria-invalid` with its error text wired via `aria-describedby`.
- [ ] 3.2b Validation timing + focus: blur validates / live once invalid / all on submit; focus first invalid; save/cancel emits.
      Done when: tests: error appears on blur, clears live on input, submit shows all errors + focuses first invalid,
      cancel emits without mutating props.
- [ ] 3.3 `ExpenseList.vue` + `ExpenseItem.vue`: date/description/category/amount via `formatCents`; emits `edit`/`delete` with id.
      Done when: tests: renders N rows, nl-NL amounts (compare `'€\u00a0…'` or normalize via a helper), both events emitted with the right id.
- [ ] 3.4a `ConfirmDialog.vue` markup: `role="dialog"`, `aria-modal`, `aria-labelledby`; ESC/backdrop → cancel.
      Done when: tests assert the ARIA attributes, ESC emits cancel, backdrop click emits cancel.
- [ ] 3.4b Dialog focus: focus trap, initial focus on Cancel, focus restored to trigger.
      Done when: tests: initial focus lands on Cancel, Tab cycles only inside the dialog, focus returns to the trigger after close.
- [ ] 3.5a Wire create/edit in App.vue: edit prefills, save sets updatedAt (id/createdAt stable), cancel = no change;
      form resets after a successful add and leaves edit mode after a save.
      Done when: tests: add → row appears + form reset; edit → prefilled, updatedAt changes, id/createdAt stable;
      save → leaves edit mode; cancel → list untouched.
- [ ] 3.5b Delete wired only via confirm dialog.
      Done when: test: delete → row gone only after confirm; cancel/dismiss → list untouched.
- [ ] 3.6 **Phase 3 test task** — full gates, paste output, wait for OK.
      Manual browser check in `npm run dev`: add 5 expenses, edit one, delete one, refresh → list unchanged.
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 4 — Filtering & sorting
- [ ] 4.1 `useExpenseFilters`: `category: 'all'|Category`, `sortField: 'date'`, `sortOrder: 'desc'`; `visible(all)` = filter → sort.
      Done when: pipeline tests incl. tie-breaker + date-desc default, plus a test with 1000 expenses asserting filter → sort is correct.
- [ ] 4.2 `CategoryFilter.vue`: "All categories" + 4 options, disabled when list empty, emits selection.
      Done when: tests: emits value, `disabled` when no expenses, enabled when there are.
- [ ] 4.3 `SortControls.vue`: date/amount × asc/desc, disabled when list empty.
      Done when: tests: emits field/order changes + disabled state.
- [ ] 4.4 Wire into App; "Clear filters" action when the filter hides everything; empty ≠ no-results copy.
      Done when: tests: filtered-to-zero shows no-results + clear button; zero expenses shows empty state instead;
      saving an item hidden by the active filter pushes a toast saying so.
- [ ] 4.5 **Phase 4 test task** — full gates, paste output, wait for OK.
      Manual browser check in `npm run dev` (walk filtering and sorting by hand).
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 5 — Dashboard summary
- [ ] 5.1 `useExpenseSummary(all)`: `totalCents` over ALL expenses + `CategorySummary[]` (all 4, zeros included),
      each with `sharePercent` (guarded: total 0 → 0, never NaN).
      Done when: tests: total ignores any filter, per-category sums/counts, all-zero → 4 zero rows,
      `sharePercent` is 0 when total is 0 and never NaN.
- [ ] 5.2 `DashboardSummary.vue`: total via `formatCents` (0 → `'€\u00a00,00'`) + 4 colored rows with amount, count and `sharePercent`.
      Done when: tests: renders total + 4 rows incl. `sharePercent`; total 0 renders exactly `'€\u00a00,00'`
      (nl-NL puts a non-breaking space after `€` — compare `'€\u00a0…'` or normalize via a helper).
- [ ] 5.3 **Phase 5 test task** — full gates, paste output, wait for OK.
      Manual browser check in `npm run dev` (walk the dashboard by hand).
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 6 — Persistence wiring
- [ ] 6.1 Hydration in App: loads from localStorage on init; invalid records dropped per `parseStoredPayload` status/dropped.
      Done when: tests seed storage → only valid expenses render, dropped count matches bad records.
- [ ] 6.2 Save roundtrip: mutation writes `StoredPayload`; fresh mount re-reads it.
      Done when: tests: mutate → assert storage JSON shape → re-mount App → same list shown.
- [ ] 6.3 `AlertBanner.vue`: `role="alert"` while `writeFailed`, hidden after a successful write; also shows 'saved data unreadable' (status corrupt) or 'N entries skipped' (dropped > 0).
      Done when: tests: banner visible on failure, gone once retry succeeds; corrupt/dropped storage messages render.
- [ ] 6.4 **Phase 6 test task** — full gates, paste output, wait for OK.
      Manual browser check in `npm run dev` (mutate, refresh, confirm the data survives).
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 7 — Polish
- [ ] 7.1 Empty vs no-results states (`EmptyState.vue`, mode prop): add-CTA vs clear-filters.
      Done when: tests assert the right copy and button per mode.
- [ ] 7.2 `ToastStack.vue`: one `aria-live="polite"` region, max 3, 4 s auto-dismiss, close button; wired to `useToasts`.
      Done when: tests: region attributes, 4th toast rejected, auto-removal with fake timers, close removes.
- [ ] 7.3 Disabled states: Save disabled while edit form not dirty; filter/sort disabled while list empty.
      Done when: tests assert `disabled` in both cases and enabled in their counterparts.
- [ ] 7.4 Accessibility audit: label↔input association for every field, `aria-invalid`/`aria-describedby` wiring,
      keyboard-only path, visible focus rings, dialog focus trap re-verified.
      Manual keyboard checklist (all must pass):
      - Tab order: filter → sort → form fields → Save → Cancel → list actions.
      - Enter submits the form; an invalid submit moves focus to the first invalid field.
      - Delete opens the dialog with focus on Cancel; Tab cycles only inside; Esc closes; focus returns to the Delete button.
      - Every interactive element has a visible focus ring; toasts never steal focus.
      Done when: component tests assert label/for + aria attrs on all fields; the manual keyboard checklist above passes.
- [ ] 7.5 Visual polish: layout, responsive, category colors, spacing — plain CSS only, no new deps.
      Done when: `npm run build` green + visual check in `npm run dev`.
- [ ] 7.6 **Final verification** — `test`, `typecheck`, `lint`, `build` all green; paste all output; wait for OK.
      Manual browser check in `npm run dev` (full click-through of every feature).
      Reflect: any new pattern or decision → update AGENTS.md.

## Phase 8 — Stretch (only if time)
- [ ] 8.1 Cross-tab `storage` event: adopt re-validated payload; removed key → empty list.
      Done when: tests dispatch StorageEvent with valid / invalid / removed values → state matches each case.
- [ ] 8.2 Expense edited here deleted in another tab → draft discarded + toast pushed.
      Done when: test: open edit → fire external-delete event → form resets, toast present.
