<script setup lang="ts">
import { ref } from 'vue'

import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import { useExpenses } from './composables/useExpenses'
import { useLocalStorage } from './composables/useLocalStorage'
import type { Expense, ExpenseInput } from './types'

const { expenses, save } = useLocalStorage()
const { create, update } = useExpenses(expenses, save)

const editing = ref<Expense | null>(null)

function onSave(value: ExpenseInput) {
  if (editing.value) {
    update(editing.value.id, value)
    editing.value = null
  } else {
    create(value)
  }
}

function onCancel() {
  editing.value = null
}

function onEdit(id: string) {
  editing.value = expenses.value.find((e) => e.id === id) ?? null
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Expense Tracker</h1>
    </header>
    <main class="app-main">
      <section class="dashboard-section" aria-label="Dashboard"></section>
      <section class="form-section" aria-label="Expense form">
        <ExpenseForm :key="editing?.id ?? 'new'" :initial="editing" @save="onSave" @cancel="onCancel" />
      </section>
      <section class="list-section" aria-label="Expenses">
        <ExpenseList :expenses="expenses" @edit="onEdit" />
      </section>
    </main>
  </div>
</template>
