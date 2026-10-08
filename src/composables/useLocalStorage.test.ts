import { describe, expect, it } from 'vitest'

import { Category } from '../categories'
import type { Expense } from '../types'
import { STORAGE_KEY, useLocalStorage, type StorageLike } from './useLocalStorage'

class FakeStorage implements StorageLike {
  private map = new Map<string, string>()
  failWrites = false

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) ?? null) : null
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('quota exceeded')
    this.map.set(key, value)
  }
}

const validExpense: Expense = {
  id: 'id-1',
  description: 'Lunch',
  amountCents: 1234,
  category: Category.Food,
  date: '2026-10-01',
  createdAt: '2026-10-01T10:00:00.000Z',
}

function loaded(storage: FakeStorage) {
  return useLocalStorage({ storage })
}

describe('useLocalStorage', () => {
  it('starts empty when the key is missing', () => {
    const { expenses, status, dropped } = loaded(new FakeStorage())
    expect(expenses.value).toEqual([])
    expect(status).toBe('empty')
    expect(dropped).toBe(0)
  })

  it('loads a valid payload', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    const { expenses, status } = loaded(storage)
    expect(expenses.value).toEqual([validExpense])
    expect(status).toBe('ok')
  })

  it('starts empty on corrupt data', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    const { expenses, status } = loaded(storage)
    expect(expenses.value).toEqual([])
    expect(status).toBe('corrupt')
  })

  it('drops invalid records and keeps the rest', () => {
    const storage = new FakeStorage()
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, expenses: [validExpense, { ...validExpense, amountCents: 'nope' }] }),
    )
    const { expenses, status, dropped } = loaded(storage)
    expect(expenses.value).toEqual([validExpense])
    expect(status).toBe('ok')
    expect(dropped).toBe(1)
  })

  it('save writes the StoredPayload shape', () => {
    const storage = new FakeStorage()
    const { expenses, save } = loaded(storage)
    expenses.value = [validExpense]
    save()
    const raw = storage.getItem(STORAGE_KEY)
    if (raw === null) throw new Error('expected storage to contain the payload')
    const parsed: unknown = JSON.parse(raw)
    expect(parsed).toEqual({ version: 1, expenses: [validExpense] })
  })

  it('sets writeFailed when setItem throws and clears it on the next successful save', () => {
    const storage = new FakeStorage()
    const { expenses, writeFailed, save } = loaded(storage)

    storage.failWrites = true
    expenses.value = [validExpense]
    save()
    expect(writeFailed.value).toBe(true)

    storage.failWrites = false
    save()
    expect(writeFailed.value).toBe(false)
  })

  it('keeps the in-memory mutation when the write fails', () => {
    const storage = new FakeStorage()
    const { expenses, save } = loaded(storage)
    storage.failWrites = true
    expenses.value = [validExpense]
    save()
    expect(expenses.value).toEqual([validExpense])
  })

  it('handleStorageEvent re-reads the key', () => {
    const storage = new FakeStorage()
    const { expenses, handleStorageEvent } = loaded(storage)
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    handleStorageEvent({ key: STORAGE_KEY, newValue: null })
    expect(expenses.value).toEqual([validExpense])
  })

  it('handleStorageEvent ignores other keys', () => {
    const storage = new FakeStorage()
    const { expenses, handleStorageEvent } = loaded(storage)
    handleStorageEvent({ key: 'other-key', newValue: null })
    expect(expenses.value).toEqual([])
  })

  it('calls onStorageEvent after adopting the payload', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    const seen: string[] = []
    const { expenses, handleStorageEvent } = useLocalStorage({
      storage,
      onStorageEvent: (event) => {
        if (event.key !== null) seen.push(event.key)
      },
    })
    handleStorageEvent({ key: STORAGE_KEY, newValue: null })
    expect(expenses.value).toEqual([validExpense])
    expect(seen).toEqual([STORAGE_KEY])
  })
})

describe('cross-tab storage events', () => {
  function dispatchStorageEvent(key: string | null): void {
    const event = new Event('storage')
    Object.assign(event, { key, newValue: null })
    window.dispatchEvent(event)
  }

  it('adopts a valid payload written by another tab', () => {
    const storage = new FakeStorage()
    const { expenses } = loaded(storage)
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))

    dispatchStorageEvent(STORAGE_KEY)

    expect(expenses.value).toEqual([validExpense])
  })

  it('starts empty when the key is removed in another tab', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    const { expenses } = loaded(storage)
    expect(expenses.value).toEqual([validExpense])

    storage.removeItem(STORAGE_KEY)
    dispatchStorageEvent(STORAGE_KEY)

    expect(expenses.value).toEqual([])
  })

  it('ignores corrupt data written by another tab', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    const { expenses } = loaded(storage)

    storage.setItem(STORAGE_KEY, '{not json')
    dispatchStorageEvent(STORAGE_KEY)

    expect(expenses.value).toEqual([])
  })

  it('ignores events for other keys', () => {
    const storage = new FakeStorage()
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses: [validExpense] }))
    const { expenses } = loaded(storage)

    dispatchStorageEvent('other-key')

    expect(expenses.value).toEqual([validExpense])
  })
})
