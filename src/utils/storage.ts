import { isCategory } from '../categories'
import type { Expense, StoredPayload } from '../types'
import { isCalendarDate } from './dates'

export type ParseStatus = 'ok' | 'empty' | 'corrupt'

export interface ParseResult {
  expenses: Expense[]
  status: ParseStatus
  dropped: number
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isExpense(v: unknown): v is Expense {
  if (!isRecord(v)) return false
  return (
    typeof v.id === 'string' &&
    typeof v.description === 'string' &&
    typeof v.amountCents === 'number' &&
    Number.isInteger(v.amountCents) &&
    isCategory(v.category) &&
    typeof v.date === 'string' &&
    isCalendarDate(v.date) &&
    typeof v.createdAt === 'string' &&
    (v.updatedAt === undefined || typeof v.updatedAt === 'string')
  )
}

export function parseStoredPayload(raw: string | null): ParseResult {
  if (raw === null) return { expenses: [], status: 'empty', dropped: 0 }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { expenses: [], status: 'corrupt', dropped: 0 }
  }

  if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.expenses)) {
    return { expenses: [], status: 'corrupt', dropped: 0 }
  }

  const expenses: Expense[] = []
  let dropped = 0
  for (const record of data.expenses) {
    if (isExpense(record)) {
      expenses.push(record)
    } else {
      dropped += 1
    }
  }

  return { expenses, status: 'ok', dropped }
}

export function serializePayload(expenses: Expense[]): string {
  const payload: StoredPayload = { version: 1, expenses }
  return JSON.stringify(payload)
}
