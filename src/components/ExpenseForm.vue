<script setup lang="ts">
import { CATEGORIES } from '../categories'
import { useExpenseForm } from '../composables/useExpenseForm'
import type { ExpenseInput } from '../types'

const props = defineProps<{
  initial?: ExpenseInput | null
}>()

const emit = defineEmits<{
  save: [value: ExpenseInput]
  cancel: []
}>()

const { draft, errors, setField, blurField, submit, firstInvalidField } = useExpenseForm(props.initial)

function onInput(field: 'description' | 'amount' | 'date', event: Event) {
  setField(field, (event.target as HTMLInputElement).value)
}

function hasError(field: 'description' | 'amount' | 'category' | 'date'): boolean {
  return errors.value[field] !== undefined
}

function errorId(field: string): string {
  return `expense-${field}-error`
}

function onSubmit() {
  const value = submit()
  if (value === null) {
    focusFirstInvalid()
    return
  }
  emit('save', value)
}

function onCancel() {
  emit('cancel')
}

function focusFirstInvalid() {
  const field = firstInvalidField()
  if (field === null) return
  const el = document.getElementById(`expense-${field}`)
  el?.focus()
}
</script>

<template>
  <form class="expense-form" novalidate @submit.prevent="onSubmit">
    <div class="field">
      <label for="expense-description">Description</label>
      <input
        id="expense-description"
        type="text"
        :value="draft.description"
        :aria-invalid="hasError('description')"
        :aria-describedby="hasError('description') ? errorId('description') : undefined"
        @input="onInput('description', $event)"
        @blur="blurField('description')"
      />
      <p v-if="hasError('description')" :id="errorId('description')" class="error">
        {{ errors.description }}
      </p>
    </div>

    <div class="field">
      <label for="expense-amount">Amount</label>
      <input
        id="expense-amount"
        type="text"
        inputmode="decimal"
        :value="draft.amount"
        :aria-invalid="hasError('amount')"
        :aria-describedby="hasError('amount') ? errorId('amount') : undefined"
        @input="onInput('amount', $event)"
        @blur="blurField('amount')"
      />
      <p v-if="hasError('amount')" :id="errorId('amount')" class="error">
        {{ errors.amount }}
      </p>
    </div>

    <fieldset class="field">
      <legend>Category</legend>
      <label v-for="c in CATEGORIES" :key="c.id" class="radio-label">
        <input
          :id="`expense-category-${c.id}`"
          type="radio"
          name="expense-category"
          :value="c.id"
          :checked="draft.category === c.id"
          :aria-invalid="hasError('category')"
          :aria-describedby="hasError('category') ? errorId('category') : undefined"
          @change="setField('category', c.id)"
        />
        {{ c.label }}
      </label>
      <p v-if="hasError('category')" :id="errorId('category')" class="error">
        {{ errors.category }}
      </p>
    </fieldset>

    <div class="field">
      <label for="expense-date">Date</label>
      <input
        id="expense-date"
        type="date"
        :value="draft.date"
        :aria-invalid="hasError('date')"
        :aria-describedby="hasError('date') ? errorId('date') : undefined"
        @input="onInput('date', $event)"
        @blur="blurField('date')"
      />
      <p v-if="hasError('date')" :id="errorId('date')" class="error">
        {{ errors.date }}
      </p>
    </div>

    <div class="actions">
      <button type="submit">Save</button>
      <button type="button" @click="onCancel">Cancel</button>
    </div>
  </form>
</template>
