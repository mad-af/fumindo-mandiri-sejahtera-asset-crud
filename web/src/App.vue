<script setup lang="ts">
import { ref } from 'vue';
import ToastContainer from './components/ToastContainer.vue';
import AssetManagerView from './views/AssetManagerView.vue';
import DatabaseView from './views/DatabaseView.vue';

type Tab = 'assets' | 'database';

const activeTab = ref<Tab>('assets');

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  {
    id: 'assets',
    label: 'Manajemen Aset',
    icon: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  },
  {
    id: 'database',
    label: 'Database',
    icon: 'M12 8c4.97 0 9-1.34 9-3s-4.03-3-9-3-9 1.34-9 3 4.03 3 9 3zM21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5',
  },
];
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div>
        <div class="brand">
          <span class="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" width="17" height="17">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
            </svg>
          </span>
          <span class="brand-text">Fumindo &middot; Asset Management</span>
        </div>

        <h1 class="page-title">
          {{ activeTab === 'assets' ? 'Manajemen Aset' : 'Database Inspector' }}
        </h1>
        <p class="page-subtitle">
          {{
            activeTab === 'assets'
              ? 'Kelola data aset beserta stok dan kategorinya.'
              : 'Lihat isi tabel, struktur skema, dan jalankan query langsung ke PostgreSQL.'
          }}
        </p>
      </div>

      <a
        class="btn btn-secondary"
        href="http://localhost:3001/api/docs"
        target="_blank"
        rel="noopener"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" width="15" height="15">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        Dokumentasi API
      </a>
    </header>

    <nav class="tabs" aria-label="Navigasi utama">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        class="tab"
        :class="{ 'is-active': activeTab === tab.id }"
        type="button"
        :aria-current="activeTab === tab.id ? 'page' : undefined"
        @click="activeTab = tab.id"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"
          stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <path :d="tab.icon" />
        </svg>
        {{ tab.label }}
      </button>
    </nav>

    <AssetManagerView v-if="activeTab === 'assets'" />
    <DatabaseView v-else />

    <ToastContainer />
  </main>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: var(--primary);
  color: #fff;
}

.brand-text {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-muted);
}

.page-title {
  font-size: 26px;
  font-weight: 680;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.page-subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: var(--text-muted);
}

.tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  margin-bottom: 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 15px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-size: 13.5px;
  font-weight: 500;
  transition: background-color 0.14s ease, color 0.14s ease;
}

.tab:hover {
  color: var(--text);
  background: var(--surface-2);
}

.tab.is-active {
  background: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.tab.is-active:hover {
  background: var(--primary-hover);
  color: #fff;
}
</style>
