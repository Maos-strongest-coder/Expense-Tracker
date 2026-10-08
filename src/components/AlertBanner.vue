<script setup lang="ts">
import { computed } from 'vue'

import type { ParseStatus } from '../utils/storage'

const props = defineProps<{
  writeFailed: boolean
  status: ParseStatus
  dropped: number
}>()

const message = computed(() => {
  if (props.writeFailed) {
    return 'Could not save your changes to this browser.'
  }
  if (props.status === 'corrupt') {
    return 'Saved data unreadable — starting fresh.'
  }
  if (props.dropped > 0) {
    return props.dropped === 1 ? '1 entry skipped' : `${props.dropped} entries skipped`
  }
  return null
})
</script>

<template>
  <p v-if="message" class="alert-banner" role="alert">{{ message }}</p>
</template>
