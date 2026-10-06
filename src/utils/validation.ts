import { isCategory } from '../categories'
import type { ExpenseDraft, ExpenseInput, FormErrors, ValidationResult } from '../types'
import { isCalendarDate, isFutureDate, MIN_DATE } from './dates'
import { parseAmountToCents } from './money'

export const MAX_AMOUNT_CENTS = 100_000_000

export function validateField(field: keyof ExpenseDraft, draft: ExpenseDraft): string | undefined {
  switch (field) {
    case 'description': {
      const trimmed = draft.description.trim()
      if (trimmed.length === 0) return 'Description is required'
      if (trimmed.length < 2) return 'Description must be at least 2 characters'
      if (trimmed.length > 120) return 'Description must be at most 120 characters'
      return undefined
    }
    case 'amount': {
      if (draft.amount.trim().length === 0) return 'Amount is required'
      const cents = parseAmountToCents(draft.amount)
      if (cents === null) return 'Enter a valid amount, max 2 decimals'
      if (cents <= 0) return 'Amount must be greater than 0'
      if (cents > MAX_AMOUNT_CENTS) return 'Amount is too large'
      return undefined
    }
    case 'category': {
      if (!isCategory(draft.category)) return 'Category is required'
      return undefined
    }
    case 'date': {
      if (!isCalendarDate(draft.date)) return 'Enter a valid date (YYYY-MM-DD)'
      if (draft.date < MIN_DATE) return 'Date must be 2000-01-01 or later'
      if (isFutureDate(draft.date)) return 'Date cannot be in the future'
      return undefined
    }
  }
}

export function validateExpense(draft: ExpenseDraft): ValidationResult {
  const errors: FormErrors = {}
  for (const field of ['description', 'amount', 'category', 'date'] as const) {
    const message = validateField(field, draft)
    if (message !== undefined) errors[field] = message
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors }

  const amountCents = parseAmountToCents(draft.amount)
  const category = draft.category
  if (amountCents === null || !isCategory(category)) return { ok: false, errors }

  const value: ExpenseInput = {
    description: draft.description.trim(),
    amountCents,
    category,
    date: draft.date,
  }
  return { ok: true, value }
}
