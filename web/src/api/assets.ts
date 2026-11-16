import { http } from './client';
import type {
  Asset,
  AssetStats,
  CreateAssetPayload,
  ListAssetsParams,
  PaginatedAssets,
  UpdateAssetPayload,
} from '../types/asset';

/** Semua panggilan HTTP ke endpoint asset. */
export const assetsApi = {
  /** List asset dengan pencarian, filter kategori, dan pagination. */
  list(params: ListAssetsParams = {}): Promise<PaginatedAssets> {
    const query = new URLSearchParams();

    if (params.search) {
      query.set('search', params.search);
    }
    if (params.category) {
      query.set('category', params.category);
    }
    if (params.page) {
      query.set('page', String(params.page));
    }
    if (params.limit) {
      query.set('limit', String(params.limit));
    }

    const suffix = query.toString();
    return http.get<PaginatedAssets>(`/assets${suffix ? `?${suffix}` : ''}`);
  },

  /** Ambil satu asset berdasarkan id. */
  get(id: number): Promise<Asset> {
    return http.get<Asset>(`/assets/${id}`);
  },

  /** Ringkasan agregat untuk kartu dashboard. */
  stats(): Promise<AssetStats> {
    return http.get<AssetStats>('/assets/stats');
  },

  /** Buat asset baru. */
  create(payload: CreateAssetPayload): Promise<Asset> {
    return http.post<Asset>('/assets', payload);
  },

  /** Perbarui asset yang ada. */
  update(id: number, payload: UpdateAssetPayload): Promise<Asset> {
    return http.patch<Asset>(`/assets/${id}`, payload);
  },

  /** Hapus asset. */
  remove(id: number): Promise<void> {
    return http.delete<void>(`/assets/${id}`);
  },
};
