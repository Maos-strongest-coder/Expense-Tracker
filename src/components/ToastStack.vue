<script setup lang="ts">
import type { Toast } from '../composables/useToasts'

defineProps<{
  toasts: Toast[]
}>()

const emit = defineEmits<{
  dismiss: [id: number]
}>()
</script>

<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div v-for="toast in toasts" :key="toast.id" class="toast" role="alert">
      <span>{{ toast.message }}</span>
      <button type="button" @click="emit('dismiss', toast.id)" aria-label="Dismiss">×</button>
    </div>
  </div>
</template>
