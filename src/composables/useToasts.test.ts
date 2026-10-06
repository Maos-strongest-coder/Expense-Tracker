import { afterEach, describe, expect, it, vi } from 'vitest'

import { MAX_TOASTS, TOAST_DURATION_MS, useToasts } from './useToasts'

afterEach(() => {
  vi.useRealTimers()
})

describe('useToasts', () => {
  it('starts empty', () => {
    const { toasts } = useToasts()
    expect(toasts.value).toEqual([])
  })

  it('push adds a toast', () => {
    const { toasts, push } = useToasts()
    push('Saved')
    expect(toasts.value).toEqual([{ id: 1, message: 'Saved' }])
  })

  it('caps the stack at 3 toasts', () => {
    const { toasts, push } = useToasts()
    push('one')
    push('two')
    push('three')
    push('four')
    expect(toasts.value).toHaveLength(MAX_TOASTS)
    expect(toasts.value.map((t) => t.message)).toEqual(['one', 'two', 'three'])
  })

  it('auto-dismisses after 4 seconds', () => {
    vi.useFakeTimers()
    const { toasts, push } = useToasts()
    push('Saved')
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(TOAST_DURATION_MS - 1)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1)
    expect(toasts.value).toHaveLength(0)
  })

  it('dismiss removes a toast manually', () => {
    vi.useFakeTimers()
    const { toasts, push, dismiss } = useToasts()
    push('one')
    push('two')
    dismiss(toasts.value[0].id)
    expect(toasts.value).toEqual([{ id: 2, message: 'two' }])
  })

  it('dismiss ignores an unknown id', () => {
    const { toasts, push, dismiss } = useToasts()
    push('one')
    dismiss(999)
    expect(toasts.value).toHaveLength(1)
  })
})
