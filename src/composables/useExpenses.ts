import type { Ref } from 'vue'

import type { Expense, ExpenseInput } from '../types'

export interface UseExpensesResult {
  create: (input: ExpenseInput) => Expense
  update: (id: string, input: ExpenseInput) => void
  remove: (id: string) => void
}

export function useExpenses(list: Ref<Expense[]>, save: () => void): UseExpensesResult {
  function create(input: ExpenseInput): Expense {
    const expense: Expense = {
      id: crypto.randomUUID(),
      ...input,
      createdAt: new Date().toISOString(),
    }
    list.value = [...list.value, expense]
    save()
    return expense
  }

  function update(id: string, input: ExpenseInput): void {
    const index = list.value.findIndex((e) => e.id === id)
    if (index === -1) return
    const existing = list.value[index]
    list.value[index] = { ...existing, ...input, updatedAt: new Date().toISOString() }
    save()
  }

  function remove(id: string): void {
    const next = list.value.filter((e) => e.id !== id)
    if (next.length === list.value.length) return
    list.value = next
    save()
  }

  return { create, update, remove }
}
