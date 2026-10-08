<script setup lang="ts">
defineProps<{
  mode: 'empty' | 'no-results'
}>()

const emit = defineEmits<{
  cta: []
}>()
</script>

<template>
  <div class="empty-state" :class="{ 'no-results': mode === 'no-results' }">
    <p>{{ mode === 'empty' ? 'No expenses yet.' : 'No expenses match your filters.' }}</p>
    <button type="button" @click="emit('cta')">
      {{ mode === 'empty' ? 'Add your first expense' : 'Clear filters' }}
    </button>
  </div>
</template>
