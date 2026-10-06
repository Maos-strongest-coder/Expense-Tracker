import type { Category } from './categories'

export interface Expense {
  id: string
  description: string
  amountCents: number
  category: Category
  date: string
  createdAt: string
  updatedAt?: string
}

export type ExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>

export interface ExpenseDraft {
  description: string
  amount: string
  category: Category | null
  date: string
}

export type FormErrors = Partial<Record<keyof ExpenseDraft, string>>

export type ValidationResult = { ok: true; value: ExpenseInput } | { ok: false; errors: FormErrors }

export type SortField = 'date' | 'amount'

export type SortOrder = 'asc' | 'desc'

export type CategoryFilter = Category | 'all'

export interface FilterOptions {
  category: CategoryFilter
  sortField: SortField
  sortOrder: SortOrder
}

export interface CategorySummary {
  category: Category
  label: string
  color?: string
  totalCents: number
  count: number
  sharePercent: number
}

export interface StoredPayload {
  version: 1
  expenses: Expense[]
}
