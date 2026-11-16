<script setup lang="ts">
import type { AssetStats } from '../types/asset';

defineProps<{
  stats: AssetStats;
  loading?: boolean;
}>();
</script>

<template>
  <section class="stats-grid">
    <article class="card stat">
      <div class="stat-head">
        <span class="stat-label">Total Aset</span>
        <span class="stat-icon stat-icon--primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
          </svg>
        </span>
      </div>
      <strong class="stat-value">{{ stats.total_assets }}</strong>
      <span class="stat-foot">
        {{ stats.consumable }} consumable &middot; {{ stats.non_consumable }} non-consumable
      </span>
    </article>

    <article class="card stat">
      <div class="stat-head">
        <span class="stat-label">Total Stok</span>
        <span class="stat-icon stat-icon--info">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </span>
      </div>
      <strong class="stat-value">{{ stats.total_stock }}</strong>
      <span class="stat-foot">unit barang tersedia</span>
    </article>

    <article class="card stat">
      <div class="stat-head">
        <span class="stat-label">Consumable</span>
        <span class="stat-icon stat-icon--success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.5 4.27 9 5.77 5.5 10.5 4 9l3.5-4.73z" />
            <path d="M21 8c0 5-8 12-8 12s-8-7-8-12a4 4 0 0 1 8 0 4 4 0 0 1 8 0z" />
          </svg>
        </span>
      </div>
      <strong class="stat-value">{{ stats.consumable }}</strong>
      <span class="stat-foot">barang habis pakai</span>
    </article>

    <article class="card stat">
      <div class="stat-head">
        <span class="stat-label">Stok Menipis</span>
        <span class="stat-icon stat-icon--warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
        </span>
      </div>
      <strong class="stat-value">{{ stats.low_stock }}</strong>
      <span class="stat-foot">stok &le; 10 unit</span>
    </article>
  </section>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.stat {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
}

.stat-icon svg {
  width: 16px;
  height: 16px;
}

.stat-icon--primary {
  background: var(--primary-soft);
  color: var(--primary);
}

.stat-icon--info {
  background: #f0f9ff;
  color: #0284c7;
}

.stat-icon--success {
  background: var(--success-soft);
  color: var(--success);
}

.stat-icon--warning {
  background: var(--warning-soft);
  color: var(--warning);
}

.stat-value {
  font-size: 26px;
  font-weight: 650;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.stat-foot {
  font-size: 12.5px;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 460px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
