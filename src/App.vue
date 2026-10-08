<script setup lang="ts">
import { ref } from 'vue'

import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useExpenses } from './composables/useExpenses'
import { useLocalStorage } from './composables/useLocalStorage'
import { useToasts } from './composables/useToasts'
import type { Expense, ExpenseInput } from './types'

const { expenses, save } = useLocalStorage()
const { create, update, remove } = useExpenses(expenses, save)

const editing = ref<Expense | null>(null)
const formVersion = ref(0)

const { toasts, push: pushToast, dismiss: dismissToast } = useToasts()

const confirmDialogRef = ref<InstanceType<typeof ConfirmDialog> | null>(null)

const dialogOptions = ref<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}>({
  title: 'Are you sure?',
  message: '',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
})

function onSave(value: ExpenseInput) {
  if (editing.value) {
    update(editing.value.id, value)
    editing.value = null
  } else {
    create(value)
  }
  formVersion.value += 1
}

function onCancel() {
  editing.value = null
  formVersion.value += 1
}

function onEdit(id: string) {
  editing.value = expenses.value.find((e) => e.id === id) ?? null
}

async function onDelete(id: string) {
  dialogOptions.value = {
    title: 'Delete expense?',
    message: 'This action cannot be undone.',
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
  }
  const confirmed = await confirmDialogRef.value?.open()
  if (confirmed) {
    remove(id)
    pushToast('Expense deleted')
  }
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
        <ExpenseForm
          :key="editing ? `edit-${editing.id}` : `create-${formVersion}`"
          :initial="editing"
          @save="onSave"
          @cancel="onCancel"
        />
      </section>
      <section class="list-section" aria-label="Expenses">
        <ExpenseList :expenses="expenses" @edit="onEdit" @delete="onDelete" />
      </section>
    </main>

    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div v-for="toast in toasts" :key="toast.id" class="toast" role="alert">
        <span>{{ toast.message }}</span>
        <button type="button" @click="dismissToast(toast.id)" aria-label="Dismiss">×</button>
      </div>
    </div>

    <ConfirmDialog
      ref="confirmDialogRef"
      :title="dialogOptions.title"
      :message="dialogOptions.message"
      :confirm-label="dialogOptions.confirmLabel"
      :cancel-label="dialogOptions.cancelLabel"
    />
  </div>
</template>
