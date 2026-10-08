import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import { CATEGORIES, Category } from '../categories'
import type { Expense } from '../types'
import { useExpenseSummary } from './useExpenseSummary'

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

describe('useExpenseSummary', () => {
  it('returns a total of 0 and 4 zero rows for an empty list', () => {
    const all = ref<Expense[]>([])
    const summary = useExpenseSummary(all)

    expect(summary.value.totalCents).toBe(0)
    expect(summary.value.categories).toHaveLength(4)
    for (const row of summary.value.categories) {
      expect(row.totalCents).toBe(0)
      expect(row.count).toBe(0)
      expect(row.sharePercent).toBe(0)
      expect(Number.isNaN(row.sharePercent)).toBe(false)
    }
  })

  it('sums the total over ALL expenses regardless of any filter state', () => {
    const all = ref<Expense[]>([
      expense({ id: 'a', amountCents: 1000, category: Category.Food }),
      expense({ id: 'b', amountCents: 2500, category: Category.Transport }),
      expense({ id: 'c', amountCents: 500, category: Category.Food }),
    ])
    const summary = useExpenseSummary(all)

    expect(summary.value.totalCents).toBe(4000)
  })

  it('groups per category with sums and counts, all 4 categories present', () => {
    const all = ref<Expense[]>([
      expense({ id: 'a', amountCents: 1000, category: Category.Food }),
      expense({ id: 'b', amountCents: 2000, category: Category.Food }),
      expense({ id: 'c', amountCents: 500, category: Category.Transport }),
    ])
    const summary = useExpenseSummary(all)

    expect(summary.value.categories.map((r) => r.category)).toEqual(
      CATEGORIES.map((c) => c.id),
    )

    const food = summary.value.categories[0]
    expect(food.label).toBe('Food')
    expect(food.totalCents).toBe(3000)
    expect(food.count).toBe(2)

    const transport = summary.value.categories[1]
    expect(transport.totalCents).toBe(500)
    expect(transport.count).toBe(1)

    expect(summary.value.categories[2].count).toBe(0)
    expect(summary.value.categories[3].count).toBe(0)
  })

  it('computes sharePercent against the total', () => {
    const all = ref<Expense[]>([
      expense({ id: 'a', amountCents: 7500, category: Category.Food }),
      expense({ id: 'b', amountCents: 2500, category: Category.Other }),
    ])
    const summary = useExpenseSummary(all)

    const byCategory = Object.fromEntries(
      summary.value.categories.map((r) => [r.category, r.sharePercent]),
    )
    expect(byCategory[Category.Food]).toBe(75)
    expect(byCategory[Category.Other]).toBe(25)
    expect(byCategory[Category.Transport]).toBe(0)
    expect(byCategory[Category.Entertainment]).toBe(0)
  })

  it('guards sharePercent when the total is 0: never NaN', () => {
    const all = ref<Expense[]>([
      expense({ id: 'a', amountCents: 0, category: Category.Food }),
    ])
    const summary = useExpenseSummary(all)

    expect(summary.value.totalCents).toBe(0)
    for (const row of summary.value.categories) {
      expect(row.sharePercent).toBe(0)
      expect(Number.isNaN(row.sharePercent)).toBe(false)
    }
  })

  it('reacts to list mutations', () => {
    const all = ref<Expense[]>([expense({ amountCents: 1000 })])
    const summary = useExpenseSummary(all)

    expect(summary.value.totalCents).toBe(1000)

    all.value = [...all.value, expense({ id: 'b', amountCents: 500, category: Category.Other })]
    expect(summary.value.totalCents).toBe(1500)
    expect(summary.value.categories[0].count).toBe(1)
    expect(summary.value.categories[3].count).toBe(1)
  })
})
