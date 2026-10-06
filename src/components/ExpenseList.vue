<script setup lang="ts">
import type { Expense } from '../types'
import ExpenseItem from './ExpenseItem.vue'

defineProps<{
  expenses: Expense[]
}>()

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <ul class="expense-list">
    <ExpenseItem
      v-for="expense in expenses"
      :key="expense.id"
      :expense="expense"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
    />
  </ul>
</template>
