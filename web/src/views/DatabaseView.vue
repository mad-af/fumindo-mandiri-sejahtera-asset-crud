<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { databaseApi } from '../api/database';
import { ApiError } from '../api/client';
import QueryRunner from '../components/database/QueryRunner.vue';
import RowsTable from '../components/database/RowsTable.vue';
import SchemaPanel from '../components/database/SchemaPanel.vue';
import type { TableRows, TableSchema, TableSummary } from '../types/database';

type Panel = 'rows' | 'schema' | 'query';

const tables = ref<TableSummary[]>([]);
const selectedTable = ref<string | null>(null);
const schema = ref<TableSchema | null>(null);
const rows = ref<TableRows | null>(null);

const loadingTables = ref(true);
const loadingRows = ref(false);
const loadingSchema = ref(false);
const error = ref<string | null>(null);

const panel = ref<Panel>('rows');
const page = ref(1);
const limit = ref(25);

const PANELS: Array<{ id: Panel; label: string }> = [
  { id: 'rows', label: 'Baris' },
  { id: 'schema', label: 'Struktur' },
  { id: 'query', label: 'Query' },
];

const totalPages = computed(() => rows.value?.meta.total_pages ?? 0);
const rangeStart = computed(() =>
  rows.value && rows.value.meta.total > 0
    ? (rows.value.meta.page - 1) * rows.value.meta.limit + 1
    : 0,
);
const rangeEnd = computed(() =>
  rows.value ? Math.min(rows.value.meta.page * rows.value.meta.limit, rows.value.meta.total) : 0,
);

async function loadTables() {
  loadingTables.value = true;
  error.value = null;

  try {
    tables.value = await databaseApi.tables();

    if (tables.value.length > 0 && !selectedTable.value) {
      selectedTable.value = tables.value[0].table_name;
    }
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : 'Gagal memuat daftar tabel dari database.';
  } finally {
    loadingTables.value = false;
  }
}

async function loadRows() {
  if (!selectedTable.value) {
    return;
  }

  loadingRows.value = true;

  try {
    rows.value = await databaseApi.rows(selectedTable.value, page.value, limit.value);
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : 'Gagal memuat baris tabel dari database.';
    rows.value = null;
  } finally {
    loadingRows.value = false;
  }
}

async function loadSchema() {
  if (!selectedTable.value) {
    return;
  }

  loadingSchema.value = true;

  try {
    schema.value = await databaseApi.schema(selectedTable.value);
  } catch (err) {
    error.value =
      err instanceof ApiError ? err.message : 'Gagal memuat struktur tabel dari database.';
  } finally {
    loadingSchema.value = false;
  }
}

function selectTable(table: string) {
  selectedTable.value = table;
  page.value = 1;
}

function goToPage(target: number) {
  const last = Math.max(totalPages.value, 1);
  const next = Math.min(Math.max(target, 1), last);

  if (next === page.value) {
    return;
  }

  page.value = next;
  void loadRows();
}

function onLimitChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  limit.value = Number(target.value);
  page.value = 1;
  void loadRows();
}

watch(selectedTable, () => {
  void loadRows();
  void loadSchema();
});

watch(page, () => {
  void loadRows();
});

onMounted(async () => {
  await loadTables();
  await Promise.all([loadRows(), loadSchema()]);
});
</script>

<template>
  <div class="db-layout">
    <!-- Sidebar daftar tabel -->
    <aside class="db-sidebar card">
      <div class="sidebar-head">
        <span class="sidebar-title">Tabel</span>
        <span class="count-pill">{{ tables.length }}</span>
      </div>

      <div v-if="loadingTables" class="sidebar-loading">
        <div v-for="row in 3" :key="row" class="skeleton" style="width: 100%; height: 32px" />
      </div>

      <button
        v-for="table in tables"
        :key="table.table_name"
        class="table-link"
        :class="{ 'is-active': table.table_name === selectedTable }"
        type="button"
        @click="selectTable(table.table_name)"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18" />
          <path d="M9 4v16" />
        </svg>
        <span class="table-link-name">{{ table.table_name }}</span>
        <span class="table-link-count">{{ table.row_count }}</span>
      </button>

      <p v-if="!loadingTables && tables.length === 0" class="sidebar-empty">
        Tidak ada tabel pada schema <code>public</code>.
      </p>
    </aside>

    <!-- Konten -->
    <section class="db-content card">
      <header class="content-head">
        <div>
          <h2 class="content-title">
            {{ selectedTable ?? 'Database' }}
            <span v-if="rows" class="row-badge">{{ rows.meta.total }} baris</span>
          </h2>
          <p class="content-subtitle">
            PostgreSQL &middot; schema <code>public</code> &middot;
            <span class="readonly-chip">read-only</span>
          </p>
        </div>

        <nav class="panel-tabs">
          <button
            v-for="item in PANELS"
            :key="item.id"
            class="panel-tab"
            :class="{ 'is-active': panel === item.id }"
            type="button"
            @click="panel = item.id"
          >
            {{ item.label }}
          </button>
        </nav>
      </header>

      <div v-if="error" class="alert alert-error content-alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" width="16" height="16"
          style="flex-shrink: 0; margin-top: 1px">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- Panel: Baris -->
      <div v-show="panel === 'rows'" class="panel">
        <div class="rows-toolbar">
          <p class="rows-info">
            Menampilkan <strong>{{ rangeStart }}</strong>&ndash;<strong>{{ rangeEnd }}</strong>
            dari <strong>{{ rows?.meta.total ?? 0 }}</strong> baris mentah
          </p>

          <div class="rows-controls">
            <label class="page-size">
              <span>Baris</span>
              <select class="select page-size-select" :value="limit" @change="onLimitChange">
                <option :value="25">25</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>

            <div class="page-buttons">
              <button
                class="btn btn-secondary btn-sm btn-icon"
                type="button"
                :disabled="page <= 1"
                aria-label="Halaman sebelumnya"
                @click="goToPage(page - 1)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                  stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>

              <span class="page-label">Halaman {{ page }} / {{ Math.max(totalPages, 1) }}</span>

              <button
                class="btn btn-secondary btn-sm btn-icon"
                type="button"
                :disabled="page >= totalPages"
                aria-label="Halaman berikutnya"
                @click="goToPage(page + 1)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                  stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <RowsTable
          :columns="rows?.columns ?? []"
          :rows="rows?.rows ?? []"
          :loading="loadingRows"
          empty-message="Tabel ini belum berisi data."
        />
      </div>

      <!-- Panel: Struktur -->
      <div v-show="panel === 'schema'" class="panel">
        <div v-if="loadingSchema" class="schema-loading">
          <div v-for="row in 5" :key="row" class="skeleton" style="width: 100%; height: 22px" />
        </div>
        <SchemaPanel v-else-if="schema" :schema="schema" />
      </div>

      <!-- Panel: Query -->
      <div v-show="panel === 'query'" class="panel">
        <QueryRunner />
      </div>
    </section>
  </div>
</template>

<style scoped>
.db-layout {
  display: grid;
  grid-template-columns: 232px 1fr;
  gap: 16px;
  align-items: start;
}

/* --- Sidebar --- */
.db-sidebar {
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px 10px;
  margin-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.count-pill {
  display: inline-grid;
  place-items: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}

.sidebar-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
}

.table-link {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 8px 9px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13.5px;
  text-align: left;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.table-link:hover {
  background: var(--surface-2);
  color: var(--text);
}

.table-link.is-active {
  background: var(--primary-soft);
  color: var(--primary-hover);
  font-weight: 500;
}

.table-link-name {
  flex: 1;
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 13px;
}

.table-link-count {
  font-size: 11.5px;
  color: var(--text-subtle);
  font-variant-numeric: tabular-nums;
}

.table-link.is-active .table-link-count {
  color: var(--primary);
}

.sidebar-empty {
  padding: 10px 6px;
  font-size: 12.5px;
  color: var(--text-subtle);
}

/* --- Konten --- */
.db-content {
  overflow: hidden;
}

.content-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.content-title {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 17px;
  font-weight: 650;
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
}

.row-badge {
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px 9px;
}

.content-subtitle {
  margin-top: 4px;
  font-size: 12.5px;
  color: var(--text-subtle);
}

.content-subtitle code {
  font-family: 'SF Mono', ui-monospace, Menlo, Consolas, monospace;
  font-size: 12px;
}

.readonly-chip {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 5px;
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid #a7f3d0;
  font-size: 11.5px;
  font-weight: 500;
}

.panel-tabs {
  display: flex;
  gap: 2px;
  padding: 3px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.panel-tab {
  height: 28px;
  padding: 0 13px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.12s ease, color 0.12s ease;
}

.panel-tab:hover {
  color: var(--text);
}

.panel-tab.is-active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.content-alert {
  margin: 16px 20px 0;
}

.panel {
  padding: 18px 20px 20px;
}

.rows-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.rows-info {
  font-size: 13px;
  color: var(--text-muted);
}

.rows-info strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.rows-controls {
  display: flex;
  align-items: center;
  gap: 14px;
}

.page-size {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  color: var(--text-muted);
}

.page-size-select {
  width: auto;
  height: 32px;
  padding: 0 28px 0 9px;
}

.page-buttons {
  display: flex;
  align-items: center;
  gap: 7px;
}

.page-label {
  font-size: 12.5px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.schema-loading {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 860px) {
  .db-layout {
    grid-template-columns: 1fr;
  }
}
</style>
