<script setup lang="ts">
defineProps<{
  columns: string[];
  rows: unknown[][];
  loading?: boolean;
  emptyMessage?: string;
}>();

/** Format nilai sel agar enak dibaca. */
function formatValue(value: unknown): { text: string; isNull: boolean } {
  if (value === null || value === undefined) {
    return { text: 'NULL', isNull: true };
  }

  if (typeof value === 'boolean') {
    return { text: value ? 'true' : 'false', isNull: false };
  }

  if (typeof value === 'number') {
    return { text: String(value), isNull: false };
  }

  if (typeof value === 'object') {
    return { text: JSON.stringify(value), isNull: false };
  }

  return { text: String(value), isNull: false };
}
</script>

<template>
  <div class="table-wrap">
    <table class="table raw-table">
      <thead v-if="columns.length > 0">
        <tr>
          <th v-for="column in columns" :key="column">{{ column }}</th>
        </tr>
      </thead>

      <tbody v-if="loading">
        <tr v-for="row in 5" :key="row">
          <td v-for="index in Math.max(columns.length, 1)" :key="index">
            <div class="skeleton" style="width: 70%" />
          </td>
        </tr>
      </tbody>

      <tbody v-else-if="rows.length === 0">
        <tr>
          <td :colspan="Math.max(columns.length, 1)" class="empty-cell">
            {{ emptyMessage ?? 'Tidak ada baris untuk ditampilkan.' }}
          </td>
        </tr>
      </tbody>

      <tbody v-else>
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td v-for="(value, columnIndex) in row" :key="columnIndex">
            <span :class="{ 'null-value': formatValue(value).isNull }">
              {{ formatValue(value).text }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.raw-table td {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12.5px;
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.null-value {
  color: var(--text-subtle);
  font-style: italic;
}

.empty-cell {
  text-align: center;
  color: var(--text-muted);
  padding: 32px 16px;
  font-family: var(--font) !important;
  white-space: normal !important;
}
</style>
