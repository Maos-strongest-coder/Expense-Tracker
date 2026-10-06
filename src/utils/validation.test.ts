import { afterEach, describe, expect, it, vi } from 'vitest'

import { Category } from '../categories'
import type { ExpenseDraft } from '../types'
import { validateExpense, validateField } from './validation'

afterEach(() => {
  vi.useRealTimers()
})

const validDraft: ExpenseDraft = {
  description: 'Lunch',
  amount: '12,34',
  category: Category.Food,
  date: '2026-10-01',
}

function draftWith(patch: Partial<ExpenseDraft>): ExpenseDraft {
  return { ...validDraft, ...patch }
}

describe('validateField — description', () => {
  it('requires a description', () => {
    expect(validateField('description', draftWith({ description: '   ' }))).toBe('Description is required')
  })

  it('requires at least 2 characters after trimming', () => {
    expect(validateField('description', draftWith({ description: ' a ' }))).toBe(
      'Description must be at least 2 characters',
    )
  })

  it('requires at most 120 characters', () => {
    expect(validateField('description', draftWith({ description: 'x'.repeat(121) }))).toBe(
      'Description must be at most 120 characters',
    )
  })

  it('accepts a valid description', () => {
    expect(validateField('description', validDraft)).toBeUndefined()
  })
})

describe('validateField — amount', () => {
  it('requires an amount', () => {
    expect(validateField('amount', draftWith({ amount: '' }))).toBe('Amount is required')
    expect(validateField('amount', draftWith({ amount: '   ' }))).toBe('Amount is required')
  })

  it('rejects an invalid amount', () => {
    expect(validateField('amount', draftWith({ amount: 'abc' }))).toBe('Enter a valid amount, max 2 decimals')
    expect(validateField('amount', draftWith({ amount: '1.234' }))).toBe('Enter a valid amount, max 2 decimals')
  })

  it('requires an amount greater than 0', () => {
    expect(validateField('amount', draftWith({ amount: '0' }))).toBe('Amount must be greater than 0')
    expect(validateField('amount', draftWith({ amount: '-5' }))).toBe('Amount must be greater than 0')
  })

  it('rejects an amount above the cap', () => {
    expect(validateField('amount', draftWith({ amount: '1000000,01' }))).toBe('Amount is too large')
  })

  it('accepts a valid amount', () => {
    expect(validateField('amount', validDraft)).toBeUndefined()
  })
})

describe('validateField — category', () => {
  it('requires a category', () => {
    expect(validateField('category', draftWith({ category: null }))).toBe('Category is required')
  })

  it('rejects an unknown category', () => {
    expect(validateField('category', draftWith({ category: 'housing' as Category }))).toBe('Category is required')
  })

  it('accepts every Category member', () => {
    for (const category of Object.values(Category)) {
      expect(validateField('category', draftWith({ category }))).toBeUndefined()
    }
  })
})

describe('validateField — date', () => {
  it('rejects a malformed or impossible date', () => {
    expect(validateField('date', draftWith({ date: '31-10-2026' }))).toBe('Enter a valid date (YYYY-MM-DD)')
    expect(validateField('date', draftWith({ date: '2026-02-30' }))).toBe('Enter a valid date (YYYY-MM-DD)')
  })

  it('rejects a date below the minimum', () => {
    expect(validateField('date', draftWith({ date: '1999-12-31' }))).toBe('Date must be 2000-01-01 or later')
  })

  it('rejects a future date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0))
    expect(validateField('date', draftWith({ date: '2026-10-08' }))).toBe('Date cannot be in the future')
  })

  it('accepts today and the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0))
    expect(validateField('date', validDraft)).toBeUndefined()
    expect(validateField('date', draftWith({ date: '2026-10-07' }))).toBeUndefined()
  })
})

describe('validateExpense', () => {
  it('returns ok with the parsed ExpenseInput', () => {
    const result = validateExpense(validDraft)
    expect(result).toEqual({
      ok: true,
      value: {
        description: 'Lunch',
        amountCents: 1234,
        category: Category.Food,
        date: '2026-10-01',
      },
    })
  })

  it('trims the description in the parsed value', () => {
    const result = validateExpense(draftWith({ description: '  Lunch  ' }))
    expect(result.ok && result.value.description).toBe('Lunch')
  })

  it('returns all errors at once', () => {
    const result = validateExpense({ description: '', amount: '', category: null, date: '' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual(['amount', 'category', 'date', 'description'])
    }
  })
})
