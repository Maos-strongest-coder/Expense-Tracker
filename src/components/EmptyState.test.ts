import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import EmptyState from './EmptyState.vue'

describe('EmptyState', () => {
  it('renders the empty copy and add-CTA for mode "empty"', () => {
    const wrapper = mount(EmptyState, { props: { mode: 'empty' } })

    expect(wrapper.find('p').text()).toBe('No expenses yet.')
    expect(wrapper.find('button').text()).toBe('Add your first expense')
  })

  it('renders the no-results copy and clear-filters action for mode "no-results"', () => {
    const wrapper = mount(EmptyState, { props: { mode: 'no-results' } })

    expect(wrapper.find('p').text()).toBe('No expenses match your filters.')
    expect(wrapper.find('button').text()).toBe('Clear filters')
  })

  it('emits cta when the button is clicked', async () => {
    const wrapper = mount(EmptyState, { props: { mode: 'empty' } })
    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('cta')).toHaveLength(1)
  })
})
