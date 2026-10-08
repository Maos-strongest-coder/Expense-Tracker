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
})
