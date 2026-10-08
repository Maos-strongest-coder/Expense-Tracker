import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import AlertBanner from './AlertBanner.vue'

const defaultProps = {
  writeFailed: false,
  status: 'ok' as const,
  dropped: 0,
}

describe('AlertBanner', () => {
  it('renders nothing when storage is fine', () => {
    const wrapper = mount(AlertBanner, { props: defaultProps })
    expect(wrapper.find('.alert-banner').exists()).toBe(false)
  })

  it('shows a persistent role="alert" message while writing fails', () => {
    const wrapper = mount(AlertBanner, { props: { ...defaultProps, writeFailed: true } })
    const banner = wrapper.find('.alert-banner')

    expect(banner.attributes('role')).toBe('alert')
    expect(banner.text()).toContain('Could not save your changes to this browser.')
  })

  it('hides the write-failure message after a successful write', async () => {
    const wrapper = mount(AlertBanner, { props: { ...defaultProps, writeFailed: true } })
    expect(wrapper.find('.alert-banner').exists()).toBe(true)

    await wrapper.setProps({ writeFailed: false })
    expect(wrapper.find('.alert-banner').exists()).toBe(false)
  })

  it('shows the unreadable-data message when parsing was corrupt', () => {
    const wrapper = mount(AlertBanner, { props: { ...defaultProps, status: 'corrupt' } })
    const banner = wrapper.find('.alert-banner')

    expect(banner.attributes('role')).toBe('alert')
    expect(banner.text()).toContain('unreadable')
  })

  it('shows how many entries were skipped', () => {
    const wrapper = mount(AlertBanner, { props: { ...defaultProps, dropped: 2 } })
    expect(wrapper.find('.alert-banner').text()).toBe('2 entries skipped')
  })

  it('uses singular copy for a single skipped entry', () => {
    const wrapper = mount(AlertBanner, { props: { ...defaultProps, dropped: 1 } })
    expect(wrapper.find('.alert-banner').text()).toBe('1 entry skipped')
  })

  it('prefers the write-failure message over load warnings', () => {
    const wrapper = mount(AlertBanner, {
      props: { writeFailed: true, status: 'corrupt', dropped: 3 },
    })
    expect(wrapper.find('.alert-banner').text()).toContain('Could not save')
  })
})
