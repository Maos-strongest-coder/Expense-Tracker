<script setup lang="ts">
import type { SortField, SortOrder } from '../types'

defineProps<{
  field: SortField
  order: SortOrder
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:field': [value: SortField]
  'update:order': [value: SortOrder]
}>()

function onFieldChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  if (target.value === 'date' || target.value === 'amount') {
    emit('update:field', target.value)
  }
}

function onOrderChange(event: Event): void {
  const target = event.target
  if (!(target instanceof HTMLSelectElement)) return
  if (target.value === 'asc' || target.value === 'desc') {
    emit('update:order', target.value)
  }
}
</script>

<template>
  <div class="sort-controls">
    <div class="sort-control">
      <label for="sort-field">Sort by</label>
      <select id="sort-field" :value="field" :disabled="disabled" @change="onFieldChange">
        <option value="date">Date</option>
        <option value="amount">Amount</option>
      </select>
    </div>
    <div class="sort-control">
      <label for="sort-order">Order</label>
      <select id="sort-order" :value="order" :disabled="disabled" @change="onOrderChange">
        <option value="desc">Newest / highest first</option>
        <option value="asc">Oldest / lowest first</option>
      </select>
    </div>
  </div>
</template>
