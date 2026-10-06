import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

import App from './App.vue'
import { Category } from './categories'
import { STORAGE_KEY } from './composables/useLocalStorage'
import type { Expense } from './types'
import { formatCents } from './utils/money'

const wrappers: VueWrapper[] = []

function mountApp(): VueWrapper {
  const wrapper = mount(App, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  while (wrappers.length > 0) {
    wrappers.pop()?.unmount()
  }
  localStorage.clear()
})

function seed(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, expenses }))
}

function storedExpenses(): Expense[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) throw new Error('expected storage to contain expenses')
  const parsed: unknown = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null || !('expenses' in parsed)) {
    throw new Error('expected a StoredPayload')
  }
  const expenses = (parsed as { expenses: unknown }).expenses
  if (!Array.isArray(expenses)) throw new Error('expected expenses to be an array')
  return expenses as Expense[]
}

const existing: Expense = {
  id: 'id-1',
  description: 'Lunch',
  amountCents: 1234,
  category: Category.Food,
  date: '2026-10-01',
  createdAt: '2026-10-01T10:00:00.000Z',
}

async function fillForm(wrapper: VueWrapper, description: string, amount: string, date: string): Promise<void> {
  await wrapper.find('#expense-description').setValue(description)
  await wrapper.find('#expense-amount').setValue(amount)
  await wrapper.find(`#expense-category-${Category.Food}`).trigger('click')
  await wrapper.find('#expense-date').setValue(date)
}

describe('App', () => {
  it('renders the header', () => {
    const wrapper = mountApp()
    expect(wrapper.find('header h1').text()).toBe('Expense Tracker')
  })

  it('adds an expense and resets the form', async () => {
    const wrapper = mountApp()

    await fillForm(wrapper, 'Lunch', '12,34', '2026-10-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect(wrapper.find('.expense-description').text()).toBe('Lunch')
    expect(wrapper.find('.expense-amount').text()).toBe(formatCents(1234))
    expect((wrapper.find('#expense-description').element as HTMLInputElement).value).toBe('')
  })

  it('prefills the form when editing', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[0].trigger('click')
    await flushPromises()

    expect((wrapper.find('#expense-description').element as HTMLInputElement).value).toBe('Lunch')
    expect((wrapper.find('#expense-amount').element as HTMLInputElement).value).toBe(formatCents(1234))
    expect((wrapper.find('#expense-date').element as HTMLInputElement).value).toBe('2026-10-01')
  })

  it('updates the expense on save, keeping id and createdAt', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[0].trigger('click')
    await flushPromises()
    await wrapper.find('#expense-amount').setValue('20,00')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.expense-amount').text()).toBe(formatCents(2000))

    const [saved] = storedExpenses()
    expect(saved.id).toBe(existing.id)
    expect(saved.createdAt).toBe(existing.createdAt)
    expect(saved.updatedAt).toBeTruthy()
    expect(saved.amountCents).toBe(2000)
  })

  it('leaves edit mode after a save', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[0].trigger('click')
    await flushPromises()
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect((wrapper.find('#expense-description').element as HTMLInputElement).value).toBe('')
    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
  })

  it('leaves the list untouched on cancel', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[0].trigger('click')
    await flushPromises()
    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect((wrapper.find('#expense-description').element as HTMLInputElement).value).toBe('')
    expect(storedExpenses()).toEqual([existing])
  })
})
