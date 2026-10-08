import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import { CATEGORIES, Category } from '../categories'
import CategoryFilter from './CategoryFilter.vue'

describe('CategoryFilter', () => {
  it('renders "All categories" plus one option per category', () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: 'all' } })
    const options = wrapper.findAll('option')

    expect(options[0].text()).toBe('All categories')
    expect(options).toHaveLength(1 + CATEGORIES.length)
    expect(options.slice(1).map((o) => o.text())).toEqual(CATEGORIES.map((c) => c.label))
  })

  it('has a label associated with the select', () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: 'all' } })
    const label = wrapper.find('label')
    const select = wrapper.find('select')

    expect(label.attributes('for')).toBe('category-filter')
    expect(select.attributes('id')).toBe('category-filter')
  })

  it('emits the selected category', async () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: 'all' } })
    await wrapper.find('select').setValue(Category.Transport)

    expect(wrapper.emitted('update:modelValue')).toEqual([[Category.Transport]])
  })

  it('emits "all" when All categories is selected', async () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: Category.Food } })
    await wrapper.find('select').setValue('all')

    expect(wrapper.emitted('update:modelValue')).toEqual([['all']])
  })

  it('is disabled when the list is empty', () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: 'all', disabled: true } })
    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
  })

  it('is enabled when there are expenses', () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: 'all', disabled: false } })
    expect(wrapper.find('select').attributes('disabled')).toBeUndefined()
  })

  it('reflects the current modelValue', () => {
    const wrapper = mount(CategoryFilter, { props: { modelValue: Category.Food } })
    expect(wrapper.find('select').element.value).toBe(Category.Food)
  })
})
