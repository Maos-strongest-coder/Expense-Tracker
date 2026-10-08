<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import CategoryFilter from './components/CategoryFilter.vue'
import AlertBanner from './components/AlertBanner.vue'
import DashboardSummary from './components/DashboardSummary.vue'
import EmptyState from './components/EmptyState.vue'
import ExpenseForm from './components/ExpenseForm.vue'
import ExpenseList from './components/ExpenseList.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import SortControls from './components/SortControls.vue'
import ToastStack from './components/ToastStack.vue'
import { useExpenseFilters } from './composables/useExpenseFilters'
import { useExpenses } from './composables/useExpenses'
import { useExpenseSummary } from './composables/useExpenseSummary'
import { useLocalStorage } from './composables/useLocalStorage'
import { useToasts } from './composables/useToasts'
import type { Expense, ExpenseInput } from './types'

const externalChange = ref(false)
const { expenses, writeFailed, status, dropped, save } = useLocalStorage({
  onStorageEvent: () => {
    externalChange.value = true
  },
})
const { create, update, remove } = useExpenses(expenses, save)
const { category, sortField, sortOrder, visible, clear } = useExpenseFilters()
const summary = useExpenseSummary(expenses)

const visibleExpenses = computed(() => visible(expenses.value))

watch(expenses, (list) => {
  if (!externalChange.value) return
  externalChange.value = false
  const editingExpense = editing.value
  if (editingExpense && !list.some((e) => e.id === editingExpense.id)) {
    editing.value = null
    pushToast('This expense was deleted in another tab.')
  }
})

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

function isHiddenByFilter(savedCategory: ExpenseInput['category']): boolean {
  return category.value !== 'all' && category.value !== savedCategory
}

function onSave(value: ExpenseInput) {
  if (editing.value) {
    update(editing.value.id, value)
    editing.value = null
  } else {
    create(value)
  }
  formVersion.value += 1
  if (isHiddenByFilter(value.category)) {
    pushToast('Saved, but hidden by the current filter.')
  }
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

function clearFilters() {
  clear()
}

function focusForm() {
  document.querySelector<HTMLInputElement>('#expense-description')?.focus()
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Expense Tracker</h1>
    </header>
    <AlertBanner :write-failed="writeFailed" :status="status" :dropped="dropped" />
    <main class="app-main">
      <section class="dashboard-section" aria-label="Dashboard">
        <DashboardSummary :summary="summary" />
      </section>
      <section class="toolbar" aria-label="Filter and sort expenses">
        <CategoryFilter v-model="category" :disabled="expenses.length === 0" />
        <SortControls
          :field="sortField"
          :order="sortOrder"
          :disabled="expenses.length === 0"
          @update:field="sortField = $event"
          @update:order="sortOrder = $event"
        />
      </section>
      <section class="form-section" aria-label="Expense form">
        <ExpenseForm
          :key="editing ? `edit-${editing.id}` : `create-${formVersion}`"
          :initial="editing"
          @save="onSave"
          @cancel="onCancel"
        />
      </section>
      <section class="list-section" aria-label="Expenses">
        <EmptyState v-if="expenses.length === 0" mode="empty" @cta="focusForm" />
        <EmptyState v-else-if="visibleExpenses.length === 0" mode="no-results" @cta="clearFilters" />
        <ExpenseList v-else :expenses="visibleExpenses" @edit="onEdit" @delete="onDelete" />
      </section>
    </main>

    <ToastStack :toasts="toasts" @dismiss="dismissToast" />

    <ConfirmDialog
      ref="confirmDialogRef"
      :title="dialogOptions.title"
      :message="dialogOptions.message"
      :confirm-label="dialogOptions.confirmLabel"
      :cancel-label="dialogOptions.cancelLabel"
    />
  </div>
</template>
