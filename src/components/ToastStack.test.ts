import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import type { Toast } from '../composables/useToasts'
import ToastStack from './ToastStack.vue'

const toasts: Toast[] = [
  { id: 1, message: 'Expense deleted' },
  { id: 2, message: 'Saved, but hidden by the current filter.' },
]

describe('ToastStack', () => {
  it('renders a single aria-live="polite" region', () => {
    const wrapper = mount(ToastStack, { props: { toasts } })
    const regions = wrapper.findAll('[aria-live="polite"]')

    expect(regions).toHaveLength(1)
    expect(regions[0].classes()).toContain('toast-stack')
  })

  it('renders one alert per toast with its message', () => {
    const wrapper = mount(ToastStack, { props: { toasts } })
    const items = wrapper.findAll('.toast')

    expect(items).toHaveLength(2)
    expect(items[0].attributes('role')).toBe('alert')
    expect(items[0].find('span').text()).toBe('Expense deleted')
    expect(items[1].find('span').text()).toBe('Saved, but hidden by the current filter.')
  })

  it('emits dismiss with the toast id when the close button is clicked', async () => {
    const wrapper = mount(ToastStack, { props: { toasts } })
    await wrapper.findAll('.toast')[1].find('button').trigger('click')

    expect(wrapper.emitted('dismiss')).toEqual([[2]])
  })

  it('renders nothing when there are no toasts', () => {
    const wrapper = mount(ToastStack, { props: { toasts: [] } })
    expect(wrapper.find('.toast').exists()).toBe(false)
  })
})
