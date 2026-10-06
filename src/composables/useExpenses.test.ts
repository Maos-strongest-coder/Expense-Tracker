import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { Category } from '../categories'
import type { Expense, ExpenseInput } from '../types'
import { useExpenses } from './useExpenses'

const input: ExpenseInput = {
  description: 'Lunch',
  amountCents: 1234,
  category: Category.Food,
  date: '2026-10-01',
}

describe('useExpenses', () => {
  it('create adds an expense with id and createdAt, then saves', () => {
    const list = ref<Expense[]>([])
    const save = vi.fn()
    const { create } = useExpenses(list, save)

    const created = create(input)

    expect(created.id).toBeTruthy()
    expect(created.createdAt).toBeTruthy()
    expect(created).toEqual({ id: created.id, ...input, createdAt: created.createdAt })
    expect(list.value).toEqual([created])
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('update changes the fields, sets updatedAt, keeps id and createdAt, then saves', () => {
    const list = ref<Expense[]>([])
    const save = vi.fn()
    const { create, update } = useExpenses(list, save)
    const created = create(input)

    update(created.id, { ...input, amountCents: 2000 })

    const updated = list.value[0]
    expect(updated.id).toBe(created.id)
    expect(updated.createdAt).toBe(created.createdAt)
    expect(updated.updatedAt).toBeTruthy()
    expect(updated.amountCents).toBe(2000)
    expect(list.value).toHaveLength(1)
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('update ignores an unknown id but still does not save', () => {
    const list = ref<Expense[]>([])
    const save = vi.fn()
    const { update } = useExpenses(list, save)

    update('missing', input)

    expect(list.value).toEqual([])
    expect(save).not.toHaveBeenCalled()
  })

  it('remove deletes the expense by id, then saves', () => {
    const list = ref<Expense[]>([])
    const save = vi.fn()
    const { create, remove } = useExpenses(list, save)
    const created = create(input)

    remove(created.id)

    expect(list.value).toEqual([])
    expect(save).toHaveBeenCalledTimes(2)
  })

  it('remove ignores an unknown id but still does not save', () => {
    const list = ref<Expense[]>([])
    const save = vi.fn()
    const { remove } = useExpenses(list, save)

    remove('missing')

    expect(list.value).toEqual([])
    expect(save).not.toHaveBeenCalled()
  })
})
