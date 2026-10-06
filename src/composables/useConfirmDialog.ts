import { ref, type Ref } from 'vue'

export interface UseConfirmDialogResult {
  isOpen: Ref<boolean>
  open: () => Promise<boolean>
  confirm: () => void
  cancel: () => void
}

export function useConfirmDialog(): UseConfirmDialogResult {
  const isOpen = ref(false)
  let resolvePromise: ((confirmed: boolean) => void) | null = null

  function open(): Promise<boolean> {
    isOpen.value = true
    return new Promise<boolean>((resolve) => {
      resolvePromise = resolve
    })
  }

  function close(result: boolean): void {
    isOpen.value = false
    if (resolvePromise) {
      resolvePromise(result)
      resolvePromise = null
    }
  }

  function confirm(): void {
    close(true)
  }

  function cancel(): void {
    close(false)
  }

  return { isOpen, open, confirm, cancel }
}
