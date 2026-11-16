<script setup lang="ts">
import { ref } from 'vue';
import { databaseApi } from '../../api/database';
import { ApiError } from '../../api/client';
import RowsTable from './RowsTable.vue';
import type { QueryResult } from '../../types/database';

const EXAMPLES: Array<{ label: string; sql: string }> = [
  {
    label: 'Semua data',
    sql: 'SELECT * FROM asset ORDER BY asset_id;',
  },
  {
    label: 'Ringkasan per kategori',
    sql: "SELECT category,\n       COUNT(*)::int AS jumlah,\n       SUM(stock_quantity)::int AS total_stok\n  FROM asset\n GROUP BY category\n ORDER BY category;",
  },
  {
    label: 'Stok menipis',
    sql: 'SELECT asset_id, asset_name, stock_quantity, category\n  FROM asset\n WHERE stock_quantity <= 10\n ORDER BY stock_quantity;',
  },
  {
    label: 'Cari nama',
    sql: "SELECT * FROM asset\n WHERE asset_name ILIKE '%kabel%'\n ORDER BY asset_id;",
  },
];

const sql = ref(EXAMPLES[0].sql);
const result = ref<QueryResult | null>(null);
const running = ref(false);
const error = ref<string | null>(null);

async function run() {
  running.value = true;
  error.value = null;

  try {
    result.value = await databaseApi.query(sql.value);
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : 'Terjadi kesalahan saat menjalankan query.';
    result.value = null;
  } finally {
    running.value = false;
  }
}

function useExample(example: string) {
  sql.value = example;
}
</script>

<template>
  <div class="query-runner">
    <div class="editor">
      <div class="editor-head">
        <span class="editor-title">Query SQL</span>
        <div class="examples">
          <span class="examples-label">Contoh:</span>
          <button
            v-for="example in EXAMPLES"
            :key="example.label"
            class="chip"
            type="button"
            @click="useExample(example.sql)"
          >
            {{ example.label }}
          </button>
        </div>
      </div>

      <textarea
        v-model="sql"
        class="sql-input"
        spellcheck="false"
        rows="7"
        placeholder="SELECT * FROM asset;"
        @keydown.meta.enter="run"
        @keydown.ctrl.enter="run"
      ></textarea>

      <div class="editor-foot">
        <span class="hint">
          Hanya query <strong>SELECT</strong> yang diizinkan &middot; maksimal 500 baris
        </span>
        <button class="btn btn-primary btn-sm" type="button" :disabled="running" @click="run">
          <span v-if="running" class="spinner" />
          {{ running ? 'Menjalankan...' : 'Jalankan Query' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round" width="16" height="16"
        style="flex-shrink: 0; margin-top: 1px">
        <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
      </svg>
      <span>{{ error }}</span>
    </div>

    <div v-if="result" class="result">
      <div class="result-head">
        <span class="result-meta">
          <strong>{{ result.row_count }}</strong> baris
          <span class="dot">&middot;</span>
          <strong>{{ result.duration_ms }}</strong> ms
        </span>
      </div>

      <div class="result-table card">
        <RowsTable
          :columns="result.columns"
          :rows="result.rows"
          empty-message="Query tidak menghasilkan baris."
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.query-runner {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.editor {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  overflow: hidden;
}

.editor-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  flex-wrap: wrap;
}

.editor-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-muted);
}

.examples {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.examples-label {
  font-size: 12px;
  color: var(--text-subtle);
}

.chip {
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  border: 1px solid var(--border-strong);
  background: var(--surface);
  font-size: 12px;
  color: var(--text-muted);
  transition: all 0.15s ease;
}

.chip:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.sql-input {
  width: 100%;
  border: none;
  outline: none;
  resize: vertical;
  padding: 14px;
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  color: var(--text);
  background: var(--surface);
}

.editor-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-top: 1px solid var(--border);
  background: var(--surface-2);
}

.result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-meta {
  font-size: 13px;
  color: var(--text-muted);
}

.result-meta strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.dot {
  margin: 0 4px;
}

.result-table {
  overflow: hidden;
}
</style>
