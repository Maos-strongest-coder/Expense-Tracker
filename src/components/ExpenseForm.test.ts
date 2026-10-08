import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'

import { Category } from '../categories'
import ExpenseForm from './ExpenseForm.vue'

const wrappers: VueWrapper[] = []

function mountForm(): VueWrapper {
  const wrapper = mount(ExpenseForm, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (wrappers.length > 0) {
    wrappers.pop()?.unmount()
  }
})

describe('ExpenseForm markup', () => {
  it('associates every field with a label via for/id', () => {
    const wrapper = mountForm()
    for (const id of ['expense-description', 'expense-amount', 'expense-date']) {
      const label = wrapper.find(`label[for="${id}"]`)
      expect(label.exists(), `missing label for ${id}`).toBe(true)
      expect(wrapper.find(`#${id}`).exists()).toBe(true)
    }
  })

  it('renders the category radios inside a fieldset with a legend', () => {
    const wrapper = mountForm()
    const fieldset = wrapper.find('fieldset')
    expect(fieldset.exists()).toBe(true)
    expect(fieldset.find('legend').exists()).toBe(true)
    const radios = fieldset.findAll('input[type="radio"]')
    expect(radios).toHaveLength(4)
  })

  it('renders aria-invalid and aria-describedby on an invalid field', async () => {
    const wrapper = mountForm()
    const description = wrapper.find('#expense-description')

    await description.trigger('blur')
    await wrapper.vm.$nextTick()

    expect(description.attributes('aria-invalid')).toBe('true')
    expect(description.attributes('aria-describedby')).toBe('expense-description-error')

    const error = wrapper.find('#expense-description-error')
    expect(error.exists()).toBe(true)
    expect(error.text()).toBe('Description is required')
  })

  it('omits aria-invalid on a valid field', async () => {
    const wrapper = mountForm()
    const description = wrapper.find('#expense-description')

    await description.setValue('Lunch')
    await description.trigger('blur')
    await wrapper.vm.$nextTick()

    expect(description.attributes('aria-invalid')).toBe('false')
    expect(description.attributes('aria-describedby')).toBeUndefined()
  })

  it('clears the error live on input once the field is invalid', async () => {
    const wrapper = mountForm()
    const description = wrapper.find('#expense-description')

    await description.trigger('blur')
    expect(wrapper.find('#expense-description-error').exists()).toBe(true)

    await description.setValue('Lunch')
    expect(wrapper.find('#expense-description-error').exists()).toBe(false)
  })

  it('shows all errors on submit and focuses the first invalid field', async () => {
    const wrapper = mountForm()

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    for (const field of ['description', 'amount', 'category', 'date']) {
      expect(wrapper.find(`#expense-${field}-error`).exists(), `missing error for ${field}`).toBe(true)
    }
    expect(document.activeElement).toBe(wrapper.find('#expense-description').element)
  })

  it('focuses the first invalid field in form order, not just the first field', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-description').setValue('Lunch')

    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(document.activeElement).toBe(wrapper.find('#expense-amount').element)
  })

  it('emits save with the parsed value on a valid submit', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-description').setValue('Lunch')
    await wrapper.find('#expense-amount').setValue('12,34')
    await wrapper.find(`#expense-category-${Category.Food}`).setValue()
    await wrapper.find('#expense-date').setValue('2026-10-01')

    await wrapper.find('form').trigger('submit')

    const events = wrapper.emitted('save')
    expect(events).toHaveLength(1)
    expect(events?.[0]).toEqual([
      { description: 'Lunch', amountCents: 1234, category: Category.Food, date: '2026-10-01' },
    ])
  })

  it('emits cancel without mutating the draft or emitting save', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-description').setValue('Lunch')

    await wrapper.find('button[type="button"]').trigger('click')

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('save')).toBeUndefined()
    expect((wrapper.find('#expense-description').element as HTMLInputElement).value).toBe('Lunch')
  })

  it('strips non-numerical characters from the amount field on input', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-amount').setValue('12abc,34x')

    expect((wrapper.find('#expense-amount').element as HTMLInputElement).value).toBe('12,34')
  })

  it('keeps digits, separators and the euro sign in the amount field', async () => {
    const wrapper = mountForm()
    await wrapper.find('#expense-amount').setValue('€ 1.234,56')

    expect((wrapper.find('#expense-amount').element as HTMLInputElement).value).toBe('€ 1.234,56')
  })

  it('wires aria-invalid and aria-describedby on the category radios when invalid', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    const radio = wrapper.find(`#expense-category-${Category.Food}`)
    expect(radio.attributes('aria-invalid')).toBe('true')
    expect(radio.attributes('aria-describedby')).toBe('expense-category-error')
    expect(wrapper.find('#expense-category-error').exists()).toBe(true)
  })
})

describe('ExpenseForm save button', () => {
  it('stays enabled in create mode so submit can show all errors', () => {
    const wrapper = mountForm()
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('is disabled in edit mode while the form is not dirty', async () => {
    const wrapper = mount(ExpenseForm, {
      props: {
        initial: {
          description: 'Lunch',
          amountCents: 1234,
          category: Category.Food,
          date: '2026-10-01',
        },
      },
    })
    wrappers.push(wrapper)

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()

    await wrapper.find('#expense-amount').setValue('20,00')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('disables again in edit mode when the edit is reverted', async () => {
    const wrapper = mount(ExpenseForm, {
      props: {
        initial: {
          description: 'Lunch',
          amountCents: 1234,
          category: Category.Food,
          date: '2026-10-01',
        },
      },
    })
    wrappers.push(wrapper)

    const amount = wrapper.find('#expense-amount')
    await amount.setValue('20,00')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()

    await amount.setValue('12,34')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
