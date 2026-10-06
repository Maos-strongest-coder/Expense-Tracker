import { getCurrentInstance, onUnmounted, ref, type Ref } from 'vue'

export interface Toast {
  id: number
  message: string
}

export const MAX_TOASTS = 3
export const TOAST_DURATION_MS = 4000

export interface UseToastsResult {
  toasts: Ref<Toast[]>
  push: (message: string) => void
  dismiss: (id: number) => void
}

export function useToasts(): UseToastsResult {
  const toasts = ref<Toast[]>([])
  let nextId = 1
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  function dismiss(id: number): void {
    const timer = timers.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.delete(id)
    }
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(message: string): void {
    if (toasts.value.length >= MAX_TOASTS) return
    const id = nextId
    nextId += 1
    toasts.value = [...toasts.value, { id, message }]
    timers.set(
      id,
      setTimeout(() => dismiss(id), TOAST_DURATION_MS),
    )
  }

  if (getCurrentInstance()) {
    onUnmounted(() => {
      for (const timer of timers.values()) {
        clearTimeout(timer)
      }
      timers.clear()
    })
  }

  return { toasts, push, dismiss }
}
