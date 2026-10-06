import { describe, expect, it } from 'vitest'

import { CATEGORIES, Category, isCategory } from './categories'

describe('Category enum', () => {
  it('has the 4 members in order', () => {
    expect(Object.values(Category)).toEqual(['food', 'transport', 'entertainment', 'other'])
  })
})

describe('CATEGORIES', () => {
  it('has exactly one entry per Category member', () => {
    expect(CATEGORIES).toHaveLength(Object.keys(Category).length)
    for (const member of Object.values(Category)) {
      const entries = CATEGORIES.filter((c) => c.id === member)
      expect(entries).toHaveLength(1)
    }
  })

  it('uses the labels Food/Transport/Entertainment/Other', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual(['Food', 'Transport', 'Entertainment', 'Other'])
  })
})

describe('isCategory', () => {
  it('accepts every Category member', () => {
    for (const member of Object.values(Category)) {
      expect(isCategory(member)).toBe(true)
    }
  })

  it('rejects non-members', () => {
    for (const v of ['Food', 'FOOD', '', 42, null, undefined, {}, []]) {
      expect(isCategory(v)).toBe(false)
    }
  })
})
