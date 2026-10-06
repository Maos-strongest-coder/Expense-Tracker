import { afterEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import ConfirmDialog from './ConfirmDialog.vue'

const wrappers: ReturnType<typeof mount>[] = []

function mountDialog(): ReturnType<typeof mount> {
  const wrapper = mount(ConfirmDialog, { attachTo: document.body })
  wrappers.push(wrapper)
  return wrapper
}

function dialogElement(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="dialog"]')
}

function dialogButtons(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('.dialog-actions button'))
}

afterEach(() => {
  while (wrappers.length > 0) {
    wrappers.pop()?.unmount()
  }
})

describe('ConfirmDialog markup', () => {
  it('renders the dialog ARIA attributes when open', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    const dialog = dialogElement()
    expect(dialog).not.toBeNull()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    expect(dialog?.getAttribute('aria-labelledby')).toBe('confirm-dialog-title')
    expect(document.querySelector('#confirm-dialog-title')).not.toBeNull()
  })

  it('emits cancel on Escape', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('emits cancel on backdrop click', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    const backdrop = document.querySelector<HTMLElement>('.dialog-backdrop')
    expect(backdrop).not.toBeNull()
    backdrop?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await flushPromises()

    expect(wrapper.emitted('cancel')).toHaveLength(1)
  })

  it('emits confirm on the confirm button', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    dialogButtons()[1]?.click()
    await flushPromises()

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})

describe('ConfirmDialog focus', () => {
  it('lands initial focus on the Cancel button', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    const [cancelButton] = dialogButtons()
    expect(document.activeElement).toBe(cancelButton)
  })

  it('cycles Tab only inside the dialog', async () => {
    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()

    const [cancelButton, confirmButton] = dialogButtons()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(confirmButton)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
    expect(document.activeElement).toBe(cancelButton)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }))
    expect(document.activeElement).toBe(confirmButton)
  })

  it('restores focus to the trigger after close', async () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()

    const wrapper = mountDialog()
    wrapper.vm.open()
    await flushPromises()
    expect(document.activeElement).not.toBe(trigger)

    dialogButtons()[1]?.click()
    await flushPromises()

    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })
})
