import { computed, reactive, ref, type Ref } from 'vue'

import { Category } from '../categories'
import type { Expense, ExpenseDraft, ExpenseInput, FormErrors } from '../types'
import { formatCents } from '../utils/money'
import { validateExpense, validateField as validateFieldUtil } from '../utils/validation'

export const FORM_FIELDS = ['description', 'amount', 'category', 'date'] as const

export type FormField = (typeof FORM_FIELDS)[number]

function emptyDraft(): ExpenseDraft {
  return { description: '', amount: '', category: null, date: '' }
}

function toDraft(expense: Expense | ExpenseInput): ExpenseDraft {
  return {
    description: expense.description,
    amount: formatCents(expense.amountCents),
    category: expense.category,
    date: expense.date,
  }
}

export interface UseExpenseFormResult {
  draft: Ref<ExpenseDraft>
  touched: Record<FormField, boolean>
  errors: Ref<FormErrors>
  isDirty: Ref<boolean>
  setField: (field: FormField, value: string | Category | null) => void
  blurField: (field: FormField) => void
  validateAll: () => boolean
  firstInvalidField: () => FormField | null
  reset: (initial?: ExpenseInput | null) => void
}

export function useExpenseForm(initial?: ExpenseInput | null): UseExpenseFormResult {
  const draft = ref<ExpenseDraft>(initial ? toDraft(initial) : emptyDraft())
  const baseline = ref<ExpenseDraft>({ ...draft.value })
  const touched = reactive<Record<FormField, boolean>>({
    description: false,
    amount: false,
    category: false,
    date: false,
  })
  const errors = ref<FormErrors>({})

  const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(baseline.value))

  function setField(field: FormField, value: string | Category | null): void {
    Object.assign(draft.value, { [field]: value })
    if (touched[field] && errors.value[field] !== undefined) {
      errors.value[field] = validateFieldUtil(field, draft.value)
    }
  }

  function blurField(field: FormField): void {
    touched[field] = true
    errors.value[field] = validateFieldUtil(field, draft.value)
  }

  function validateAll(): boolean {
    const result = validateExpense(draft.value)
    errors.value = result.ok ? {} : result.errors
    return result.ok
  }

  function firstInvalidField(): FormField | null {
    for (const field of FORM_FIELDS) {
      if (errors.value[field] !== undefined) return field
    }
    return null
  }

  function reset(nextInitial?: ExpenseInput | null): void {
    draft.value = nextInitial ? toDraft(nextInitial) : emptyDraft()
    baseline.value = { ...draft.value }
    for (const field of FORM_FIELDS) {
      touched[field] = false
    }
    errors.value = {}
  }

  return { draft, touched, errors, isDirty, setField, blurField, validateAll, firstInvalidField, reset }
}
