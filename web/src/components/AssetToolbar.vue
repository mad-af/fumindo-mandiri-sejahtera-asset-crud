<script setup lang="ts">
import type { AssetCategory } from '../types/asset';

const search = defineModel<string>('search', { default: '' });
const category = defineModel<AssetCategory | ''>('category', { default: '' });

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  add: [];
  clearFilters: [];
}>();
</script>

<template>
  <div class="toolbar card">
    <div class="toolbar-filters">
      <div class="search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <input
          v-model="search"
          class="input search-input"
          type="search"
          placeholder="Cari nama asset..."
          aria-label="Cari nama asset"
        />
      </div>

      <select
        v-model="category"
        class="select category-select"
        aria-label="Filter kategori asset"
      >
        <option value="">Semua kategori</option>
        <option value="Consumable">Consumable</option>
        <option value="Non-Consumable">Non-Consumable</option>
      </select>

      <button
        v-if="search || category"
        class="btn btn-ghost btn-sm"
        type="button"
        @click="emit('clearFilters')"
      >
        Reset
      </button>
    </div>

    <button class="btn btn-primary" type="button" @click="emit('add')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
        stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <path d="M12 5v14M5 12h14" />
      </svg>
      Tambah Aset
    </button>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-filters {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  flex-wrap: wrap;
}

.search {
  position: relative;
  flex: 1;
  min-width: 220px;
  max-width: 340px;
}

.search-icon {
  position: absolute;
  left: 11px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 15px;
  color: var(--text-subtle);
  pointer-events: none;
}

.search-input {
  padding-left: 33px;
}

.search-input::-webkit-search-cancel-button {
  cursor: pointer;
}

.category-select {
  width: auto;
  min-width: 168px;
}
</style>
