<script setup lang="ts">
import { computed } from 'vue'

import { CATEGORIES } from '../categories'
import type { Expense } from '../types'
import { formatCents } from '../utils/money'

const props = defineProps<{
  expense: Expense
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

const category = computed(() => CATEGORIES.find((c) => c.id === props.expense.category))

function onEdit() {
  emit('edit', props.expense.id)
}

function onDelete() {
  emit('delete', props.expense.id)
}
</script>

<template>
  <li class="expense-item">
    <span class="expense-date">{{ expense.date }}</span>
    <span class="expense-description">{{ expense.description }}</span>
    <span class="expense-category" :style="{ color: category?.color }">{{ category?.label }}</span>
    <span class="expense-amount">{{ formatCents(expense.amountCents) }}</span>
    <span class="expense-actions">
      <button type="button" @click="onEdit">Edit</button>
      <button type="button" @click="onDelete">Delete</button>
    </span>
  </li>
</template>
