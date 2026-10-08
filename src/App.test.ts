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

  function dialogButtons(): HTMLButtonElement[] {
    const dialog = document.querySelector('.dialog')
    if (dialog === null) throw new Error('expected the confirm dialog to be open')
    return Array.from(dialog.querySelectorAll('button'))
  }

  it('deletes the expense only after confirming in the dialog', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[1].trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect(dialogButtons()).toHaveLength(2)

    dialogButtons()[1].click()
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(0)
    expect(storedExpenses()).toEqual([])
    expect(wrapper.find('.toast').text()).toContain('Expense deleted')
  })

  it('leaves the list untouched when the delete dialog is dismissed', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.findAll('.expense-item button')[1].trigger('click')
    await flushPromises()

    dialogButtons()[0].click()
    await flushPromises()

    expect(document.querySelector('.dialog')).toBeNull()
    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect(storedExpenses()).toEqual([existing])
  })

  it('shows the empty state (not no-results) when there are no expenses', async () => {
    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.find('.empty-state').text()).toContain('No expenses yet')
    expect(wrapper.find('.empty-state button').text()).toBe('Add your first expense')
    expect(wrapper.find('.no-results').exists()).toBe(false)
  })

  it('focuses the form from the empty-state CTA', async () => {
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.find('.empty-state button').trigger('click')

    expect(document.activeElement?.id).toBe('expense-description')
  })

  it('disables the filter and sort controls while the list is empty', async () => {
    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.find('#category-filter').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#sort-field').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#sort-order').attributes('disabled')).toBeDefined()

    await fillForm(wrapper, 'Lunch', '12,34', '2026-10-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('#category-filter').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('#sort-field').attributes('disabled')).toBeUndefined()
  })

  it('shows no-results with a clear-filters action when filters hide everything', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.find('#category-filter').setValue(Category.Transport)
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(0)
    expect(wrapper.find('.no-results').text()).toContain('No expenses match your filters')
    expect(wrapper.find('.empty-state').exists()).toBe(false)

    await wrapper.find('.no-results button').trigger('click')
    await flushPromises()

    expect(wrapper.find('.no-results').exists()).toBe(false)
    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect((wrapper.find('#category-filter').element as HTMLSelectElement).value).toBe('all')
  })

  it('pushes a toast when a saved expense is hidden by the active filter', async () => {
    seed([existing])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.find('#category-filter').setValue(Category.Transport)
    await fillForm(wrapper, 'Coffee', '5,00', '2026-10-02')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(0)
    expect(storedExpenses()).toHaveLength(2)
    expect(wrapper.find('.toast').text()).toContain('hidden by the current filter')
  })

  it('does not push the hidden-filter toast for a visible save', async () => {
    const wrapper = mountApp()
    await flushPromises()

    await fillForm(wrapper, 'Lunch', '12,34', '2026-10-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.toast').exists()).toBe(false)
  })

  it('sorts the list via the sort controls', async () => {
    const cheap: Expense = {
      ...existing,
      id: 'id-2',
      description: 'Train ticket',
      amountCents: 500,
      date: '2026-09-30',
    }
    seed([existing, cheap])
    const wrapper = mountApp()
    await flushPromises()

    const descriptions = () => wrapper.findAll('.expense-description').map((n) => n.text())
    expect(descriptions()).toEqual(['Lunch', 'Train ticket'])

    await wrapper.find('#sort-order').setValue('asc')
    await flushPromises()

    expect(descriptions()).toEqual(['Train ticket', 'Lunch'])
  })

  it('filters the list via the category filter', async () => {
    const other: Expense = {
      ...existing,
      id: 'id-2',
      description: 'Cinema',
      category: Category.Entertainment,
    }
    seed([existing, other])
    const wrapper = mountApp()
    await flushPromises()

    await wrapper.find('#category-filter').setValue(Category.Entertainment)
    await flushPromises()

    expect(wrapper.findAll('.expense-description').map((n) => n.text())).toEqual(['Cinema'])
  })

  it('shows the dashboard total over ALL expenses, ignoring the active filter', async () => {
    const other: Expense = {
      ...existing,
      id: 'id-2',
      description: 'Cinema',
      category: Category.Entertainment,
      amountCents: 2000,
    }
    seed([existing, other])
    const wrapper = mountApp()
    await flushPromises()

    const total = () => wrapper.find('.dashboard-total-value').text()
    expect(total()).toBe(formatCents(1234 + 2000))

    await wrapper.find('#category-filter').setValue(Category.Entertainment)
    await flushPromises()

    expect(wrapper.findAll('.expense-item')).toHaveLength(1)
    expect(total()).toBe(formatCents(1234 + 2000))
    expect(wrapper.findAll('.dashboard-category')).toHaveLength(4)
  })
})
