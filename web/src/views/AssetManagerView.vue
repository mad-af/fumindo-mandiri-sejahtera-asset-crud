<script setup lang="ts">
import { computed, ref } from 'vue';
import { assetsApi } from '../api/assets';
import { ApiError } from '../api/client';
import AssetFormModal from '../components/AssetFormModal.vue';
import AssetStatsCards from '../components/AssetStatsCards.vue';
import AssetTable from '../components/AssetTable.vue';
import AssetToolbar from '../components/AssetToolbar.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { useAssets } from '../composables/useAssets';
import { useToast } from '../composables/useToast';
import type { Asset, CreateAssetPayload } from '../types/asset';

const {
  assets,
  stats,
  statsLoading,
  meta,
  loading,
  error,
  search,
  category,
  limit,
  fetchAssets,
  refresh,
  goToPage,
  setLimit,
} = useAssets();

const toast = useToast();

// --- State modal -----------------------------------------------------
const formOpen = ref(false);
const editingAsset = ref<Asset | null>(null);
const submitting = ref(false);
const formError = ref<string | null>(null);

// --- State konfirmasi hapus -----------------------------------------
const deletingAsset = ref<Asset | null>(null);
const deleting = ref(false);

function openCreateForm() {
  editingAsset.value = null;
  formError.value = null;
  formOpen.value = true;
}

function openEditForm(asset: Asset) {
  editingAsset.value = asset;
  formError.value = null;
  formOpen.value = true;
}

function closeForm() {
  formOpen.value = false;
  formError.value = null;
}

async function handleSubmit(payload: CreateAssetPayload) {
  submitting.value = true;
  formError.value = null;

  try {
    if (editingAsset.value) {
      await assetsApi.update(editingAsset.value.asset_id, payload);
      toast.success('Asset diperbarui', `"${payload.asset_name}" berhasil disimpan.`);
    } else {
      await assetsApi.create(payload);
      toast.success('Asset ditambahkan', `"${payload.asset_name}" berhasil disimpan.`);
    }

    formOpen.value = false;
    await refresh();
  } catch (err) {
    formError.value =
      err instanceof ApiError ? err.message : 'Terjadi kesalahan saat menyimpan data.';
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!deletingAsset.value) {
    return;
  }

  deleting.value = true;

  try {
    const name = deletingAsset.value.asset_name;
    await assetsApi.remove(deletingAsset.value.asset_id);
    toast.success('Asset dihapus', `"${name}" telah dihapus dari daftar.`);
    deletingAsset.value = null;
    await refresh();
  } catch (err) {
    toast.error(
      'Gagal menghapus',
      err instanceof ApiError ? err.message : 'Terjadi kesalahan saat menghapus asset.',
    );
  } finally {
    deleting.value = false;
  }
}

function clearFilters() {
  search.value = '';
  category.value = '';
}

function onLimitChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  setLimit(Number(target.value));
}

const deleteMessage = computed(() => {
  const name = deletingAsset.value?.asset_name ?? '';
  return `Asset "${name}" akan dihapus permanen dari database.`;
});

// --- Pagination ------------------------------------------------------
const rangeStart = computed(() =>
  meta.value.total === 0 ? 0 : (meta.value.page - 1) * meta.value.limit + 1,
);

const rangeEnd = computed(() =>
  Math.min(meta.value.page * meta.value.limit, meta.value.total),
);

const pageNumbers = computed(() => {
  const totalPages = meta.value.total_pages;
  const current = meta.value.page;

  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(current - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
});
</script>

<template>
  <AssetStatsCards :stats="stats" :loading="statsLoading" />

  <AssetToolbar
    v-model:search="search"
    v-model:category="category"
    :loading="loading"
    @add="openCreateForm"
    @clear-filters="clearFilters"
  />

  <AssetTable
    :assets="assets"
    :loading="loading"
    :error="error"
    @edit="openEditForm"
    @remove="deletingAsset = $event"
    @retry="fetchAssets"
    @add="openCreateForm"
  />

  <div class="pagination card">
    <p class="pagination-info">
      Menampilkan <strong>{{ rangeStart }}</strong>&ndash;<strong>{{ rangeEnd }}</strong>
      dari <strong>{{ meta.total }}</strong> asset
    </p>

    <div class="pagination-controls">
      <label class="page-size">
        <span>Baris</span>
        <select
          class="select page-size-select"
          :value="limit"
          @change="onLimitChange"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
        </select>
      </label>

      <div class="page-buttons">
        <button
          class="btn btn-secondary btn-sm btn-icon"
          type="button"
          :disabled="meta.page <= 1"
          aria-label="Halaman sebelumnya"
          @click="goToPage(meta.page - 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        <button
          v-for="number in pageNumbers"
          :key="number"
          class="btn btn-sm page-btn"
          :class="number === meta.page ? 'btn-primary' : 'btn-secondary'"
          type="button"
          @click="goToPage(number)"
        >
          {{ number }}
        </button>

        <button
          class="btn btn-secondary btn-sm btn-icon"
          type="button"
          :disabled="meta.page >= meta.total_pages"
          aria-label="Halaman berikutnya"
          @click="goToPage(meta.page + 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <AssetFormModal
    :open="formOpen"
    :asset="editingAsset"
    :submitting="submitting"
    :server-error="formError"
    @close="closeForm"
    @submit="handleSubmit"
  />

  <ConfirmDialog
    :open="deletingAsset !== null"
    title="Hapus asset?"
    :message="deleteMessage"
    confirm-label="Hapus Asset"
    :loading="deleting"
    @confirm="confirmDelete"
    @cancel="deletingAsset = null"
  />
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 16px;
  margin-top: 16px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-muted);
}

.pagination-info strong {
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 16px;
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
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  padding: 0 8px;
}

@media (max-width: 640px) {
  .pagination {
    justify-content: center;
  }
}
</style>
