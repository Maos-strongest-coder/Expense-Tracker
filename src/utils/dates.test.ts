import { afterEach, describe, expect, it, vi } from 'vitest'

import { MIN_DATE, isCalendarDate, isFutureDate, todayLocalISO } from './dates'

afterEach(() => {
  vi.useRealTimers()
})

describe('timezone pin', () => {
  it('runs in Europe/Amsterdam', () => {
    expect(new Date(2026, 9, 7).getTimezoneOffset()).toBe(-120)
  })
})

describe('todayLocalISO', () => {
  it('returns the local date, not the UTC date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 0, 30))
    expect(todayLocalISO()).toBe('2026-10-07')
  })
})

describe('isCalendarDate', () => {
  it('accepts real dates', () => {
    expect(isCalendarDate('2026-10-07')).toBe(true)
    expect(isCalendarDate('2024-02-29')).toBe(true)
    expect(isCalendarDate(MIN_DATE)).toBe(true)
  })

  it('rejects impossible dates', () => {
    expect(isCalendarDate('2026-02-30')).toBe(false)
    expect(isCalendarDate('2023-02-29')).toBe(false)
    expect(isCalendarDate('2026-13-01')).toBe(false)
  })

  it('rejects malformed strings', () => {
    expect(isCalendarDate('2026-1-7')).toBe(false)
    expect(isCalendarDate('2026/10/07')).toBe(false)
    expect(isCalendarDate('not-a-date')).toBe(false)
    expect(isCalendarDate('')).toBe(false)
  })
})

describe('isFutureDate', () => {
  it('is false for today and the past', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0))
    expect(isFutureDate('2026-10-07')).toBe(false)
    expect(isFutureDate('2026-10-06')).toBe(false)
  })

  it('is true for tomorrow', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 12, 0))
    expect(isFutureDate('2026-10-08')).toBe(true)
  })
})

describe('MIN_DATE', () => {
  it('is 2000-01-01', () => {
    expect(MIN_DATE).toBe('2000-01-01')
  })

  it('sorts above 1999-12-31', () => {
    expect('1999-12-31' < MIN_DATE).toBe(true)
  })
})
