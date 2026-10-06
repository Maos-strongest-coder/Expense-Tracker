import { describe, expect, it } from 'vitest'

import { useConfirmDialog } from './useConfirmDialog'

describe('useConfirmDialog', () => {
  it('opens and resolves true on confirm', async () => {
    const dialog = useConfirmDialog()
    const promise = dialog.open()
    expect(dialog.isOpen.value).toBe(true)

    dialog.confirm()

    await expect(promise).resolves.toBe(true)
    expect(dialog.isOpen.value).toBe(false)
  })

  it('opens and resolves false on cancel', async () => {
    const dialog = useConfirmDialog()
    const promise = dialog.open()

    dialog.cancel()

    await expect(promise).resolves.toBe(false)
    expect(dialog.isOpen.value).toBe(false)
  })

  it('resets closed state after close', async () => {
    const dialog = useConfirmDialog()
    const first = dialog.open()
    dialog.cancel()
    await first
    expect(dialog.isOpen.value).toBe(false)

    const second = dialog.open()
    dialog.confirm()
    await second
    expect(dialog.isOpen.value).toBe(false)
  })
})
