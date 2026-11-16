<script setup lang="ts">
import type { Asset } from '../types/asset';

defineProps<{
  assets: Asset[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  edit: [asset: Asset];
  remove: [asset: Asset];
  retry: [];
  add: [];
}>();

/** Stok dianggap menipis di bawah ambang ini. */
const LOW_STOCK_THRESHOLD = 10;

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function categoryClass(category: string): string {
  return category === 'Consumable'
    ? 'badge badge-consumable'
    : 'badge badge-non-consumable';
}
</script>

<template>
  <div class="card table-card">
    <!-- Loading -->
    <div v-if="loading" class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th>Nama Asset</th>
            <th style="width: 170px">Kategori</th>
            <th class="num" style="width: 140px">Stok</th>
            <th style="width: 130px">Dibuat</th>
            <th style="width: 96px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in 6" :key="row">
            <td><div class="skeleton" style="width: 28px" /></td>
            <td><div class="skeleton" style="width: 62%" /></td>
            <td><div class="skeleton" style="width: 110px" /></td>
            <td><div class="skeleton" style="width: 48px; margin-left: auto" /></td>
            <td><div class="skeleton" style="width: 80px" /></td>
            <td><div class="skeleton" style="width: 60px; margin-left: auto" /></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state">
      <div class="state-icon state-icon--error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" />
        </svg>
      </div>
      <h3 class="state-title">Gagal memuat data</h3>
      <p class="state-text">{{ error }}</p>
      <button class="btn btn-secondary btn-sm" type="button" @click="emit('retry')">
        Coba lagi
      </button>
    </div>

    <!-- Empty -->
    <div v-else-if="assets.length === 0" class="state">
      <div class="state-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
          stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
        </svg>
      </div>
      <h3 class="state-title">Belum ada data</h3>
      <p class="state-text">
        Tidak ada asset yang cocok dengan filter saat ini.
      </p>
      <button class="btn btn-primary btn-sm" type="button" @click="emit('add')">
        Tambah asset pertama
      </button>
    </div>

    <!-- Data -->
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 70px">ID</th>
            <th>Nama Asset</th>
            <th style="width: 170px">Kategori</th>
            <th class="num" style="width: 140px">Stok</th>
            <th style="width: 130px">Dibuat</th>
            <th style="width: 96px"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.asset_id">
            <td class="num asset-id">#{{ asset.asset_id }}</td>
            <td>
              <span class="asset-name">{{ asset.asset_name }}</span>
            </td>
            <td>
              <span :class="categoryClass(asset.category)">
                <span class="badge-dot" />{{ asset.category }}
              </span>
            </td>
            <td class="num">
              <span :class="{ 'stock-low': asset.stock_quantity <= LOW_STOCK_THRESHOLD }">
                {{ asset.stock_quantity }}
              </span>
              <span
                v-if="asset.stock_quantity <= LOW_STOCK_THRESHOLD"
                class="low-flag"
                title="Stok menipis"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                  stroke-linecap="round" stroke-linejoin="round" width="13" height="13">
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
              </span>
            </td>
            <td class="date-cell">{{ formatDate(asset.created_at) }}</td>
            <td>
              <div class="row-actions">
                <button
                  class="btn btn-ghost btn-sm btn-icon"
                  type="button"
                  title="Edit asset"
                  :aria-label="`Edit ${asset.asset_name}`"
                  @click="emit('edit', asset)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  class="btn btn-ghost btn-sm btn-icon delete-btn"
                  type="button"
                  title="Hapus asset"
                  :aria-label="`Hapus ${asset.asset_name}`"
                  @click="emit('remove', asset)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
                    <path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  overflow: hidden;
}

.asset-id {
  color: var(--text-subtle);
  font-size: 13px;
}

.date-cell {
  color: var(--text-muted);
  font-size: 13px;
  white-space: nowrap;
}

.low-flag {
  display: inline-flex;
  margin-left: 5px;
  color: var(--warning);
  vertical-align: middle;
}

.delete-btn:hover {
  color: var(--danger);
  background: var(--danger-soft);
}

.state {
  padding: 56px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.state-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  color: var(--text-subtle);
  margin-bottom: 4px;
}

.state-icon svg {
  width: 22px;
  height: 22px;
}

.state-icon--error {
  background: var(--danger-soft);
  border-color: #fecaca;
  color: var(--danger);
}

.state-title {
  font-size: 15px;
  font-weight: 600;
}

.state-text {
  font-size: 13.5px;
  color: var(--text-muted);
  max-width: 340px;
  margin-bottom: 6px;
}
</style>
