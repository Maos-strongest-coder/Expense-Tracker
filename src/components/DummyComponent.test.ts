import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DummyComponent from './DummyComponent.vue'

describe('DummyComponent', () => {
  it('mounts and renders its text', () => {
    const wrapper = mount(DummyComponent)
    expect(wrapper.text()).toBe('Dummy component')
  })
})
