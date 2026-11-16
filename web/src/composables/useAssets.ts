import { ref, watch } from 'vue';
import { assetsApi } from '../api/assets';
import { ApiError } from '../api/client';
import type {
  Asset,
  AssetCategory,
  AssetStats,
  PaginationMeta,
} from '../types/asset';

const EMPTY_STATS: AssetStats = {
  total_assets: 0,
  total_stock: 0,
  consumable: 0,
  non_consumable: 0,
  low_stock: 0,
};

/**
 * Semua state + logika untuk halaman manajemen aset.
 *
 *ENCapsulates: fetching daftar asset (dengan filter & pagination),
 * statistik dashboard, serta navigasi halaman.
 */
export function useAssets() {
  const assets = ref<Asset[]>([]);
  const stats = ref<AssetStats>({ ...EMPTY_STATS });
  const meta = ref<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    total_pages: 0,
  });

  const loading = ref(false);
  const statsLoading = ref(false);
  const error = ref<string | null>(null);

  // Filter yang aktif di UI
  const search = ref('');
  const category = ref<AssetCategory | ''>('');
  const page = ref(1);
  const limit = ref(10);

  let searchTimer: ReturnType<typeof setTimeout> | undefined;

  async function fetchAssets() {
    loading.value = true;
    error.value = null;

    try {
      const result = await assetsApi.list({
        search: search.value.trim() || undefined,
        category: category.value || undefined,
        page: page.value,
        limit: limit.value,
      });

      assets.value = result.data;
      meta.value = result.meta;

      // Kalau halaman saat ini kosong (mis. data terakhir dihapus),
      // mundur satu halaman.
      if (result.data.length === 0 && result.meta.total > 0 && page.value > 1) {
        page.value -= 1;
        return;
      }
    } catch (err) {
      error.value =
        err instanceof ApiError
          ? err.message
          : 'Terjadi kesalahan saat memuat data aset.';
    } finally {
      loading.value = false;
    }
  }

  async function fetchStats() {
    statsLoading.value = true;

    try {
      stats.value = await assetsApi.stats();
    } catch {
      // Statistik bersifat non-kritis - tabel tetap bisa dipakai.
    } finally {
      statsLoading.value = false;
    }
  }

  /** Muat ulang daftar asset + statistik (dipanggil setelah mutasi). */
  async function refresh() {
    await Promise.all([fetchAssets(), fetchStats()]);
  }

  function goToPage(target: number) {
    const lastPage = Math.max(meta.value.total_pages, 1);
    const next = Math.min(Math.max(target, 1), lastPage);

    if (next === page.value) {
      return;
    }

    page.value = next;
    void fetchAssets();
  }

  function setLimit(value: number) {
    limit.value = value;
    page.value = 1;
    void fetchAssets();
  }

  function setCategory(value: AssetCategory | '') {
    category.value = value;
  }

  // Pencarian dibdebounce 300ms agar tidak spam request per ketikan.
  watch(search, () => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      page.value = 1;
      void fetchAssets();
    }, 300);
  });

  // Ganti kategori -> kembali ke halaman pertama lalu muat ulang data.
  watch(category, () => {
    page.value = 1;
    void fetchAssets();
  });

  // Muat data awal.
  void fetchAssets();
  void fetchStats();

  return {
    assets,
    stats,
    statsLoading,
    meta,
    loading,
    error,
    search,
    category,
    page,
    limit,
    fetchAssets,
    fetchStats,
    refresh,
    goToPage,
    setLimit,
    setCategory,
  };
}
