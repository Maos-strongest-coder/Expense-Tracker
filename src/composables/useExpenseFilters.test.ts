import { describe, expect, it } from 'vitest'

import { Category } from '../categories'
import type { Expense } from '../types'
import { useExpenseFilters } from './useExpenseFilters'

function expense(patch: Partial<Expense> = {}): Expense {
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

describe('useExpenseFilters', () => {
  it('defaults to all categories, sorted by date descending', () => {
    const filters = useExpenseFilters()
    const list = [
      expense({ id: 'a', date: '2026-10-01' }),
      expense({ id: 'b', date: '2026-10-03' }),
      expense({ id: 'c', date: '2026-10-02' }),
    ]

    expect(filters.category.value).toBe('all')
    expect(filters.sortField.value).toBe('date')
    expect(filters.sortOrder.value).toBe('desc')
    expect(filters.visible(list).map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('filters by category', () => {
    const filters = useExpenseFilters()
    filters.category.value = Category.Transport
    const list = [
      expense({ id: 'a', category: Category.Transport }),
      expense({ id: 'b', category: Category.Food }),
      expense({ id: 'c', category: Category.Transport }),
    ]

    expect(filters.visible(list).map((e) => e.id)).toEqual(['a', 'c'])
  })

  it('sorts by amount in both directions', () => {
    const filters = useExpenseFilters()
    const list = [
      expense({ id: 'a', amountCents: 500 }),
      expense({ id: 'b', amountCents: 2000 }),
      expense({ id: 'c', amountCents: 1000 }),
    ]

    filters.sortField.value = 'amount'
    filters.sortOrder.value = 'asc'
    expect(filters.visible(list).map((e) => e.id)).toEqual(['a', 'c', 'b'])

    filters.sortOrder.value = 'desc'
    expect(filters.visible(list).map((e) => e.id)).toEqual(['b', 'c', 'a'])
  })

  it('sorts by date ascending', () => {
    const filters = useExpenseFilters()
    filters.sortOrder.value = 'asc'
    const list = [
      expense({ id: 'a', date: '2026-10-01' }),
      expense({ id: 'b', date: '2026-10-03' }),
      expense({ id: 'c', date: '2026-10-02' }),
    ]

    expect(filters.visible(list).map((e) => e.id)).toEqual(['a', 'c', 'b'])
  })

  it('filters before sorting: a filtered-out item never appears regardless of sort', () => {
    const filters = useExpenseFilters()
    filters.category.value = Category.Food
    filters.sortField.value = 'amount'
    filters.sortOrder.value = 'desc'
    const list = [
      expense({ id: 'food', category: Category.Food, amountCents: 100 }),
      expense({ id: 'big-other', category: Category.Other, amountCents: 999999 }),
      expense({ id: 'transport', category: Category.Transport, amountCents: 5000 }),
    ]

    expect(filters.visible(list).map((e) => e.id)).toEqual(['food'])
  })

  it('breaks ties by createdAt in the primary direction, then id', () => {
    const filters = useExpenseFilters()
    const tied = [
      expense({ id: 'second', date: '2026-10-01', createdAt: '2026-10-01T12:00:00.000Z' }),
      expense({ id: 'first', date: '2026-10-01', createdAt: '2026-10-01T08:00:00.000Z' }),
    ]

    expect(filters.visible(tied).map((e) => e.id)).toEqual(['second', 'first'])

    filters.sortOrder.value = 'asc'
    expect(filters.visible(tied).map((e) => e.id)).toEqual(['first', 'second'])
  })

  it('returns an empty array for an empty input', () => {
    const filters = useExpenseFilters()
    expect(filters.visible([])).toEqual([])
  })

  it('clear() resets the category to all', () => {
    const filters = useExpenseFilters()
    filters.category.value = Category.Food
    filters.clear()
    expect(filters.category.value).toBe('all')
  })

  it('stays correct with 1000 expenses (filter → sort)', () => {
    const filters = useExpenseFilters()
    const categories = [Category.Food, Category.Transport, Category.Entertainment, Category.Other]
    const list: Expense[] = Array.from({ length: 1000 }, (_, i) =>
      expense({
        id: `id-${String(i).padStart(4, '0')}`,
        category: categories[i % 4],
        date: `2026-${String((i % 12) + 1).padStart(2, '0')}-01`,
        amountCents: (1000 - i) * 7,
      }),
    )

    filters.category.value = Category.Food
    filters.sortField.value = 'amount'
    filters.sortOrder.value = 'desc'

    const result = filters.visible(list)
    expect(result).toHaveLength(250)
    expect(result.every((e) => e.category === Category.Food)).toBe(true)
    for (let i = 1; i < result.length; i += 1) {
      expect(result[i - 1].amountCents).toBeGreaterThanOrEqual(result[i].amountCents)
    }
    const expectedFood = list
      .filter((e) => e.category === Category.Food)
      .sort((a, b) => b.amountCents - a.amountCents)
    expect(result.map((e) => e.id)).toEqual(expectedFood.map((e) => e.id))
  })
})
