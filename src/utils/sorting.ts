import type { Expense, SortField, SortOrder } from '../types'

function direction(order: SortOrder): 1 | -1 {
  return order === 'asc' ? 1 : -1
}

function compareStrings(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

export function compareExpenses(a: Expense, b: Expense, field: SortField, order: SortOrder): number {
  const dir = direction(order)

  const primary = field === 'date' ? compareStrings(a.date, b.date) : a.amountCents - b.amountCents
  if (primary !== 0) return primary * dir

  const tie = compareStrings(a.createdAt, b.createdAt) * dir
  if (tie !== 0) return tie

  return compareStrings(a.id, b.id)
}

export function sortExpenses(list: Expense[], field: SortField, order: SortOrder): Expense[] {
  return [...list].sort((a, b) => compareExpenses(a, b, field, order))
}
