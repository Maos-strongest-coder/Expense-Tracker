import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { Category } from '../categories'
import type { DashboardSummary as SummaryData } from '../composables/useExpenseSummary'
import DashboardSummary from './DashboardSummary.vue'

const NBSP = String.fromCharCode(160)

function euro(amount: string): string {
  return '€' + NBSP + amount
}

const summary: SummaryData = {
  totalCents: 4000,
  categories: [
    {
      category: Category.Food,
      label: 'Food',
      color: '#e67e22',
      totalCents: 3000,
      count: 2,
      sharePercent: 75,
    },
    {
      category: Category.Transport,
      label: 'Transport',
      color: '#3498db',
      totalCents: 1000,
      count: 1,
      sharePercent: 25,
    },
    {
      category: Category.Entertainment,
      label: 'Entertainment',
      color: '#9b59b6',
      totalCents: 0,
      count: 0,
      sharePercent: 0,
    },
    {
      category: Category.Other,
      label: 'Other',
      color: '#7f8c8d',
      totalCents: 0,
      count: 0,
      sharePercent: 0,
    },
  ],
}

describe('DashboardSummary', () => {
  it('renders the total via formatCents', () => {
    const wrapper = mount(DashboardSummary, { props: { summary } })
    expect(wrapper.find('.dashboard-total-value').text()).toBe(euro('40,00'))
  })

  it('renders 4 rows with label, amount, count and sharePercent', () => {
    const wrapper = mount(DashboardSummary, { props: { summary } })
    const rows = wrapper.findAll('.dashboard-category')

    expect(rows).toHaveLength(4)

    expect(rows[0].find('.dashboard-category-label').text()).toBe('Food')
    expect(rows[0].find('.dashboard-category-amount').text()).toBe(euro('30,00'))
    expect(rows[0].find('.dashboard-category-count').text()).toBe('2 expenses')
    expect(rows[0].find('.dashboard-category-share').text()).toBe('75%')

    expect(rows[1].find('.dashboard-category-share').text()).toBe('25%')
    expect(rows[2].find('.dashboard-category-label').text()).toBe('Entertainment')
    expect(rows[3].find('.dashboard-category-label').text()).toBe('Other')
  })

  it('applies the category color to each row', () => {
    const wrapper = mount(DashboardSummary, { props: { summary } })
    const rows = wrapper.findAll('.dashboard-category')

    expect(rows[0].attributes('style')).toContain('color: #e67e22')
    expect(rows[1].attributes('style')).toContain('color: #3498db')
  })

  it('renders exactly the zero-euro total for an empty summary', () => {
    const empty: SummaryData = {
      totalCents: 0,
      categories: summary.categories.map((row) => ({
        ...row,
        totalCents: 0,
        count: 0,
        sharePercent: 0,
      })),
    }
    const wrapper = mount(DashboardSummary, { props: { summary: empty } })

    expect(wrapper.find('.dashboard-total-value').text()).toBe(euro('0,00'))
    expect(wrapper.findAll('.dashboard-category-share').map((n) => n.text())).toEqual([
      '0%',
      '0%',
      '0%',
      '0%',
    ])
  })

  it('uses singular copy for a count of 1', () => {
    const single: SummaryData = {
      ...summary,
      categories: summary.categories.map((row, i) =>
        i === 0 ? { ...row, count: 1 } : row,
      ),
    }
    const wrapper = mount(DashboardSummary, { props: { summary: single } })
    expect(wrapper.findAll('.dashboard-category-count')[0].text()).toBe('1 expense')
  })

  it('renders the total below the category rows with a separator', () => {
    const wrapper = mount(DashboardSummary, { props: { summary } })
    const rows = wrapper.findAll('.dashboard-category')
    const total = wrapper.find('.dashboard-total')

    expect(rows[3].element.compareDocumentPosition(total.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(total.classes()).toContain('dashboard-total')
    expect(total.find('.dashboard-total-value').text()).toBe(euro('40,00'))
  })
})
