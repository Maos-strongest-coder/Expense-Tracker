<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

import { useConfirmDialog } from '../composables/useConfirmDialog'

withDefaults(
  defineProps<{
    title?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
  }>(),
  {
    title: 'Are you sure?',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { isOpen, open, confirm: confirmDialog, cancel: cancelDialog } = useConfirmDialog()

const dialogRef = ref<HTMLElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
let triggerElement: HTMLElement | null = null

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

watch(isOpen, async (isOpenNow) => {
  if (isOpenNow) {
    triggerElement = document.activeElement instanceof HTMLElement ? document.activeElement : null
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    cancelButtonRef.value?.focus()
  } else {
    document.removeEventListener('keydown', onKeydown)
    triggerElement?.focus()
    triggerElement = null
  }
})

function trapFocus(event: KeyboardEvent): void {
  const root = dialogRef.value
  if (!root) return
  const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  if (focusable.length === 0) return
  const active = document.activeElement
  const index = active instanceof HTMLElement ? focusable.indexOf(active) : -1
  event.preventDefault()
  if (event.shiftKey) {
    const next = index <= 0 ? focusable[focusable.length - 1] : focusable[index - 1]
    next.focus()
  } else {
    const next = index === -1 || index === focusable.length - 1 ? focusable[0] : focusable[index + 1]
    next.focus()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    onCancel()
    return
  }
  if (event.key === 'Tab') trapFocus(event)
}

function onConfirm(): void {
  confirmDialog()
  emit('confirm')
}

function onCancel(): void {
  cancelDialog()
  emit('cancel')
}

function onBackdropClick(): void {
  onCancel()
}

defineExpose<{
  open: () => Promise<boolean>
}>({ open })
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dialog-backdrop" @click.self="onBackdropClick">
      <div ref="dialogRef" class="dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 id="confirm-dialog-title">{{ title }}</h2>
        <p v-if="message">{{ message }}</p>
        <div class="dialog-actions">
          <button ref="cancelButtonRef" type="button" @click="onCancel">{{ cancelLabel }}</button>
          <button type="button" @click="onConfirm">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
