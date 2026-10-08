import { describe, expect, it } from 'vitest'

import { formatCents, parseAmountToCents } from './money'

const NBSP = String.fromCharCode(160)

function euro(amount: string): string {
  return '€' + NBSP + amount
}

describe('parseAmountToCents', () => {
  it.each([
    ['12', 1200],
    ['12,34', 1234],
    ['12.34', 1234],
    ['1.234,56', 123456],
    [' 12,34 ', 1234],
    ['0.29', 29],
    ['19.99', 1999],
    ['1000000', 100000000],
    ['-5', -500],
    ['0', 0],
    ['1,23', 123],
    [euro('12,34'), 1234],
    ['€12,34', 1234],
  ])('parses %s → %i', (raw, expected) => {
    expect(parseAmountToCents(raw)).toBe(expected)
  })

  it.each(['', 'abc', '12.', '1.234', '1,234.56', '12,345', '1.234.567', '12,34.56', '+-5', '1.2.34', '€'])(
    'returns null for %s',
    (raw) => {
      expect(parseAmountToCents(raw)).toBeNull()
    },
  )

  it('round-trips the form prefill format', () => {
    expect(parseAmountToCents(formatCents(1234))).toBe(1234)
    expect(parseAmountToCents(formatCents(0))).toBe(0)
  })

  it('rejects 3 decimals', () => {
    expect(parseAmountToCents('12,345')).toBeNull()
    expect(parseAmountToCents('12.345')).toBeNull()
  })
})

describe('formatCents', () => {
  it.each([
    [0, '0,00'],
    [1234, '12,34'],
    [100000000, '1.000.000,00'],
  ])('formats %i → %s', (cents, amount) => {
    expect(formatCents(cents)).toBe(euro(amount))
  })

  it('formats non-finite values as zero', () => {
    expect(formatCents(Number.NaN)).toBe(euro('0,00'))
    expect(formatCents(Number.POSITIVE_INFINITY)).toBe(euro('0,00'))
    expect(formatCents(Number.NEGATIVE_INFINITY)).toBe(euro('0,00'))
  })
})
