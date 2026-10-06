import { describe, expect, it } from 'vitest'

import { Category } from '../categories'
import type { ExpenseInput } from '../types'
import { formatCents } from '../utils/money'
import { FORM_FIELDS, useExpenseForm } from './useExpenseForm'

const validInput: ExpenseInput = {
  description: 'Lunch',
  amountCents: 1234,
  category: Category.Food,
  date: '2026-10-01',
}

describe('useExpenseForm', () => {
  it('starts with an empty draft, no errors, and not dirty', () => {
    const form = useExpenseForm()
    expect(form.draft.value).toEqual({ description: '', amount: '', category: null, date: '' })
    expect(form.errors.value).toEqual({})
    expect(form.isDirty.value).toBe(false)
  })

  it('is silent while a field is untouched', () => {
    const form = useExpenseForm()
    form.setField('description', '')
    expect(form.errors.value.description).toBeUndefined()
  })

  it('validates on blur', () => {
    const form = useExpenseForm()
    form.blurField('description')
    expect(form.errors.value.description).toBe('Description is required')
  })

  it('clears the error live on input once the field is invalid', () => {
    const form = useExpenseForm()
    form.blurField('description')
    expect(form.errors.value.description).toBeDefined()

    form.setField('description', 'Lunch')
    expect(form.errors.value.description).toBeUndefined()
  })

  it('does not revalidate a touched field that is still valid', () => {
    const form = useExpenseForm()
    form.setField('description', 'Lunch')
    form.blurField('description')
    expect(form.errors.value.description).toBeUndefined()

    form.setField('description', 'Dinner')
    expect(form.errors.value.description).toBeUndefined()
  })

  it('validateAll shows every error at once', () => {
    const form = useExpenseForm()
    const ok = form.validateAll()
    expect(ok).toBe(false)
    expect(Object.keys(form.errors.value).sort()).toEqual([...FORM_FIELDS].sort())
  })

  it('validateAll passes for a complete draft', () => {
    const form = useExpenseForm()
    form.setField('description', 'Lunch')
    form.setField('amount', '12,34')
    form.setField('category', Category.Food)
    form.setField('date', '2026-10-01')
    expect(form.validateAll()).toBe(true)
    expect(form.errors.value).toEqual({})
  })

  it('is not dirty until the first change', () => {
    const form = useExpenseForm()
    expect(form.isDirty.value).toBe(false)
    form.setField('description', 'Lunch')
    expect(form.isDirty.value).toBe(true)
  })

  it('is dirty when a prefilled field changes', () => {
    const form = useExpenseForm(validInput)
    expect(form.isDirty.value).toBe(false)
    form.setField('description', 'Dinner')
    expect(form.isDirty.value).toBe(true)
  })

  it('firstInvalidField returns the first field with an error in form order', () => {
    const form = useExpenseForm()
    form.validateAll()
    expect(form.firstInvalidField()).toBe('description')

    form.setField('description', 'Lunch')
    form.setField('amount', '12,34')
    form.setField('category', Category.Food)
    form.setField('date', '2026-10-01')
    form.validateAll()
    expect(form.firstInvalidField()).toBeNull()
  })

  it('reset restores the empty draft and clears state', () => {
    const form = useExpenseForm()
    form.setField('description', 'Lunch')
    form.blurField('description')
    form.reset()
    expect(form.draft.value).toEqual({ description: '', amount: '', category: null, date: '' })
    expect(form.errors.value).toEqual({})
    expect(form.isDirty.value).toBe(false)
    expect(form.touched.description).toBe(false)
  })

  it('reset with a new initial prefills the draft', () => {
    const form = useExpenseForm()
    form.reset(validInput)
    expect(form.draft.value.description).toBe('Lunch')
    expect(form.draft.value.amount).toBe(formatCents(1234))
    expect(form.draft.value.category).toBe(Category.Food)
    expect(form.isDirty.value).toBe(false)
  })
})
