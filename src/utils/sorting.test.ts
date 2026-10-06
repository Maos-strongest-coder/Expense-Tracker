import { describe, expect, it } from 'vitest'

import { Category } from '../categories'
import type { Expense } from '../types'
import { compareExpenses, sortExpenses } from './sorting'

function expense(patch: Partial<Expense>): Expense {
  return {
    id: 'id-1',
    description: 'Test',
    amountCents: 1000,
    category: Category.Food,
    date: '2026-10-01',
    createdAt: '2026-10-01T10:00:00.000Z',
    ...patch,
  }
}

describe('sortExpenses', () => {
  const list = [
    expense({ id: 'b', date: '2026-10-03', amountCents: 500 }),
    expense({ id: 'a', date: '2026-10-01', amountCents: 2000 }),
    expense({ id: 'c', date: '2026-10-02', amountCents: 1000 }),
  ]

  it('sorts by date ascending', () => {
    const result = sortExpenses(list, 'date', 'asc')
    expect(result.map((e) => e.id)).toEqual(['a', 'c', 'b'])
  })

  it('sorts by date descending', () => {
    const result = sortExpenses(list, 'date', 'desc')
    expect(result.map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by amount ascending', () => {
    const result = sortExpenses(list, 'amount', 'asc')
    expect(result.map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by amount descending', () => {
    const result = sortExpenses(list, 'amount', 'desc')
    expect(result.map((e) => e.id)).toEqual(['a', 'c', 'b'])
  })

  it('does not mutate the input array', () => {
    const input = [...list]
    sortExpenses(input, 'date', 'asc')
    expect(input).toEqual(list)
  })

  it('breaks date ties by createdAt in the same direction as the primary sort', () => {
    const tied = [
      expense({ id: 'second', date: '2026-10-01', createdAt: '2026-10-01T12:00:00.000Z' }),
      expense({ id: 'first', date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' }),
    ]
    expect(sortExpenses(tied, 'date', 'asc').map((e) => e.id)).toEqual(['first', 'second'])
    expect(sortExpenses(tied, 'date', 'desc').map((e) => e.id)).toEqual(['second', 'first'])
  })

  it('breaks full ties by id', () => {
    const tied = [
      expense({ id: 'z', date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' }),
      expense({ id: 'a', date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' }),
    ]
    expect(sortExpenses(tied, 'date', 'asc').map((e) => e.id)).toEqual(['a', 'z'])
  })
})

describe('compareExpenses', () => {
  it('returns 0 for equal expenses', () => {
    const e = expense({})
    expect(compareExpenses(e, { ...e }, 'date', 'asc')).toBe(0)
  })
})
