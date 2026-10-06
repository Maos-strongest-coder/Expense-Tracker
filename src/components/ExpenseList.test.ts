import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { Category } from '../categories'
import type { Expense } from '../types'
import ExpenseList from './ExpenseList.vue'

const NBSP = String.fromCharCode(160)

function euro(amount: string): string {
  return '€' + NBSP + amount
}

const expenses: Expense[] = [
  {
    id: 'id-1',
    description: 'Lunch',
    amountCents: 1234,
    category: Category.Food,
    date: '2026-10-01',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'id-2',
    description: 'Train ticket',
    amountCents: 500,
    category: Category.Transport,
    date: '2026-10-02',
    createdAt: '2026-10-02T10:00:00.000Z',
  },
]

describe('ExpenseList', () => {
  it('renders one row per expense', () => {
    const wrapper = mount(ExpenseList, { props: { expenses } })
    expect(wrapper.findAll('.expense-item')).toHaveLength(2)
  })

  it('renders date, description, category and nl-NL amount', () => {
    const wrapper = mount(ExpenseList, { props: { expenses } })
    const rows = wrapper.findAll('.expense-item')

    expect(rows[0].find('.expense-date').text()).toBe('2026-10-01')
    expect(rows[0].find('.expense-description').text()).toBe('Lunch')
    expect(rows[0].find('.expense-category').text()).toBe('Food')
    expect(rows[0].find('.expense-amount').text()).toBe(euro('12,34'))

    expect(rows[1].find('.expense-amount').text()).toBe(euro('5,00'))
  })

  it('emits edit with the expense id', async () => {
    const wrapper = mount(ExpenseList, { props: { expenses } })
    await wrapper.findAll('.expense-item')[0].findAll('button')[0].trigger('click')
    expect(wrapper.emitted('edit')).toEqual([['id-1']])
  })

  it('emits delete with the expense id', async () => {
    const wrapper = mount(ExpenseList, { props: { expenses } })
    await wrapper.findAll('.expense-item')[1].findAll('button')[1].trigger('click')
    expect(wrapper.emitted('delete')).toEqual([['id-2']])
  })
})
