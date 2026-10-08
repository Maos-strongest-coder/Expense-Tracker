<script setup lang="ts">
import { CATEGORIES, isCategory } from '../categories'
import type { CategoryFilter } from '../types'

defineProps<{
  modelValue: CategoryFilter
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CategoryFilter]
}>()

function onChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  const value = target.value
  if (value === 'all') {
    emit('update:modelValue', 'all')
    return
  }
  if (isCategory(value)) {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <div class="category-filter">
    <label for="category-filter">Category</label>
    <select
      id="category-filter"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <option value="all">All categories</option>
      <option
        v-for="entry in CATEGORIES"
        :key="entry.id"
        :value="entry.id"
      >
        {{ entry.label }}
      </option>
    </select>
  </div>
</template>
