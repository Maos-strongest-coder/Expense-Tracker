import { ref, type Ref } from 'vue'

import { sortExpenses } from '../utils/sorting'
import type { CategoryFilter, Expense, SortField, SortOrder } from '../types'

export interface UseExpenseFiltersResult {
  category: Ref<CategoryFilter>
  sortField: Ref<SortField>
  sortOrder: Ref<SortOrder>
  visible: (all: Expense[]) => Expense[]
  clear: () => void
}

export function useExpenseFilters(): UseExpenseFiltersResult {
  const category = ref<CategoryFilter>('all')
  const sortField = ref<SortField>('date')
  const sortOrder = ref<SortOrder>('desc')

  function visible(all: Expense[]): Expense[] {
    const filtered =
      category.value === 'all' ? all : all.filter((e) => e.category === category.value)
    return sortExpenses(filtered, sortField.value, sortOrder.value)
  }

  function clear(): void {
    category.value = 'all'
  }

  return { category, sortField, sortOrder, visible, clear }
}
