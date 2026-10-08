import { computed, type ComputedRef, type Ref } from 'vue'

import { CATEGORIES } from '../categories'
import type { CategorySummary, Expense } from '../types'

export interface DashboardSummary {
  totalCents: number
  categories: CategorySummary[]
}

export function useExpenseSummary(all: Ref<Expense[]>): ComputedRef<DashboardSummary> {
  return computed(() => {
    const expenses = all.value
    const totalCents = expenses.reduce((sum, e) => sum + e.amountCents, 0)

    const categories: CategorySummary[] = CATEGORIES.map((entry) => {
      const matching = expenses.filter((e) => e.category === entry.id)
      const categoryCents = matching.reduce((sum, e) => sum + e.amountCents, 0)
      return {
        category: entry.id,
        label: entry.label,
        color: entry.color,
        totalCents: categoryCents,
        count: matching.length,
        sharePercent:
          totalCents === 0 ? 0 : Math.round((categoryCents / totalCents) * 1000) / 10,
      }
    })

    return { totalCents, categories }
  })
}
