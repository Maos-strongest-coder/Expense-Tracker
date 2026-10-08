import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import SortControls from './SortControls.vue'

describe('SortControls', () => {
  it('renders field and order selects with labels', () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc' } })

    expect(wrapper.findAll('label')).toHaveLength(2)
    expect(wrapper.find('label[for="sort-field"]').text()).toBe('Sort by')
    expect(wrapper.find('label[for="sort-order"]').text()).toBe('Order')
    expect(wrapper.findAll('select')).toHaveLength(2)
  })

  it('emits a field change', async () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc' } })
    await wrapper.find('#sort-field').setValue('amount')

    expect(wrapper.emitted('update:field')).toEqual([['amount']])
  })

  it('emits an order change', async () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc' } })
    await wrapper.find('#sort-order').setValue('asc')

    expect(wrapper.emitted('update:order')).toEqual([['asc']])
  })

  it('does not emit for an invalid field value', async () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc' } })
    await wrapper.find('#sort-field').setValue('category')

    expect(wrapper.emitted('update:field')).toBeUndefined()
  })

  it('is disabled when the list is empty', () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc', disabled: true } })

    for (const select of wrapper.findAll('select')) {
      expect(select.attributes('disabled')).toBeDefined()
    }
  })

  it('is enabled when there are expenses', () => {
    const wrapper = mount(SortControls, { props: { field: 'date', order: 'desc', disabled: false } })

    for (const select of wrapper.findAll('select')) {
      expect(select.attributes('disabled')).toBeUndefined()
    }
  })

  it('reflects the current field and order', () => {
    const wrapper = mount(SortControls, { props: { field: 'amount', order: 'asc' } })

    expect((wrapper.find('#sort-field').element as HTMLSelectElement).value).toBe('amount')
    expect((wrapper.find('#sort-order').element as HTMLSelectElement).value).toBe('asc')
  })
})
