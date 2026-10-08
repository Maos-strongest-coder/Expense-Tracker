<script setup lang="ts">
import type { DashboardSummary } from '../composables/useExpenseSummary'
import { formatCents } from '../utils/money'

defineProps<{
  summary: DashboardSummary
}>()

function countLabel(count: number): string {
  return count === 1 ? '1 expense' : `${count} expenses`
}
</script>

<template>
  <section class="dashboard" aria-label="Spending summary">
    <ul class="dashboard-categories">
      <li
        v-for="row in summary.categories"
        :key="row.category"
        class="dashboard-category"
        :style="{ color: row.color }"
      >
        <span class="dashboard-category-label">{{ row.label }}</span>
        <span class="dashboard-category-amount">{{ formatCents(row.totalCents) }}</span>
        <span class="dashboard-category-count">{{ countLabel(row.count) }}</span>
        <span class="dashboard-category-share">{{ row.sharePercent }}%</span>
      </li>
    </ul>
    <div class="dashboard-total">
      <span class="dashboard-total-label">Total</span>
      <span class="dashboard-total-value">{{ formatCents(summary.totalCents) }}</span>
    </div>
  </section>
</template>
