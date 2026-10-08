import { getCurrentInstance, onUnmounted, ref, type Ref } from 'vue'

import type { Expense } from '../types'
import { parseStoredPayload, serializePayload, type ParseStatus } from '../utils/storage'

export const STORAGE_KEY = 'expense-tracker:v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface StorageEventLike {
  key: string | null
  newValue: string | null
}

export interface UseLocalStorageOptions {
  storage?: StorageLike
  onStorageEvent?: (event: StorageEventLike) => void
}

export interface UseLocalStorageResult {
  expenses: Ref<Expense[]>
  writeFailed: Ref<boolean>
  status: ParseStatus
  dropped: number
  save: () => void
  handleStorageEvent: (event: StorageEventLike) => void
}

export function useLocalStorage(options: UseLocalStorageOptions = {}): UseLocalStorageResult {
  const storage = options.storage ?? window.localStorage
  const writeFailed = ref(false)

  const initial = parseStoredPayload(storage.getItem(STORAGE_KEY))
  const expenses = ref<Expense[]>(initial.expenses) as Ref<Expense[]>

  function save(): void {
    try {
      storage.setItem(STORAGE_KEY, serializePayload(expenses.value))
      writeFailed.value = false
    } catch {
      writeFailed.value = true
    }
  }

  function handleStorageEvent(event: StorageEventLike): void {
    if (event.key !== STORAGE_KEY) return
    const result = parseStoredPayload(storage.getItem(STORAGE_KEY))
    expenses.value = result.expenses
    if (options.onStorageEvent) {
      options.onStorageEvent(event)
    }
  }

  window.addEventListener('storage', handleStorageEvent)
  if (getCurrentInstance()) {
    onUnmounted(() => window.removeEventListener('storage', handleStorageEvent))
  }

  return { expenses, writeFailed, status: initial.status, dropped: initial.dropped, save, handleStorageEvent }
}
