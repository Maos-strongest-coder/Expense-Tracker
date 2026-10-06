import { describe, expect, it } from 'vitest'

import { Category } from '../categories'
import type { Expense } from '../types'
import { parseStoredPayload, serializePayload } from './storage'

const validExpense: Expense = {
  id: 'id-1',
  description: 'Lunch',
  amountCents: 1234,
  category: Category.Food,
  date: '2026-10-01',
  createdAt: '2026-10-01T10:00:00.000Z',
}

function payloadWith(expenses: unknown[]): string {
  return JSON.stringify({ version: 1, expenses })
}

describe('parseStoredPayload', () => {
  it('returns empty for null', () => {
    expect(parseStoredPayload(null)).toEqual({ expenses: [], status: 'empty', dropped: 0 })
  })

  it('returns corrupt for invalid JSON', () => {
    expect(parseStoredPayload('{not json')).toEqual({ expenses: [], status: 'corrupt', dropped: 0 })
  })

  it('returns corrupt for version ≠ 1', () => {
    const result = parseStoredPayload(JSON.stringify({ version: 2, expenses: [validExpense] }))
    expect(result).toEqual({ expenses: [], status: 'corrupt', dropped: 0 })
  })

  it.each(['null', '"text"', '42', '[]', '{}'])('returns corrupt for wrong shape %s', (raw) => {
    expect(parseStoredPayload(raw)).toEqual({ expenses: [], status: 'corrupt', dropped: 0 })
  })

  it('keeps valid records and reports dropped ones', () => {
    const invalid = { ...validExpense, amountCents: '1234' }
    const result = parseStoredPayload(payloadWith([validExpense, invalid, validExpense]))
    expect(result.status).toBe('ok')
    expect(result.dropped).toBe(1)
    expect(result.expenses).toEqual([validExpense, validExpense])
  })

  it('drops records failing the Expense guard', () => {
    const cases: unknown[] = [
      { ...validExpense, id: 42 },
      { ...validExpense, category: 'housing' },
      { ...validExpense, date: '2026-02-30' },
      { ...validExpense, amountCents: 12.5 },
      { ...validExpense, createdAt: null },
      'not-a-record',
      null,
    ]
    const result = parseStoredPayload(payloadWith(cases))
    expect(result.status).toBe('ok')
    expect(result.dropped).toBe(cases.length)
    expect(result.expenses).toEqual([])
  })

  it('roundtrips all-valid payloads', () => {
    const list: Expense[] = [
      validExpense,
      { ...validExpense, id: 'id-2', category: Category.Other, updatedAt: '2026-10-02T10:00:00.000Z' },
    ]
    const result = parseStoredPayload(serializePayload(list))
    expect(result).toEqual({ expenses: list, status: 'ok', dropped: 0 })
  })
})
