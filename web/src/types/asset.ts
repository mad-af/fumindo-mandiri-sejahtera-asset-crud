/** Kategori asset - nilai ini persis sama dengan enum di database. */
export type AssetCategory = 'Consumable' | 'Non-Consumable';

export const ASSET_CATEGORIES: readonly AssetCategory[] = [
  'Consumable',
  'Non-Consumable',
];

/** Representasi satu baris tabel `asset`. */
export interface Asset {
  asset_id: number;
  asset_name: string;
  stock_quantity: number;
  category: AssetCategory;
  created_at: string;
  updated_at: string;
}

/** Metadata pagination dari API. */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

/** Response list asset. */
export interface PaginatedAssets {
  data: Asset[];
  meta: PaginationMeta;
}

/** Agregat untuk kartu ringkasan dashboard. */
export interface AssetStats {
  total_assets: number;
  total_stock: number;
  consumable: number;
  non_consumable: number;
  low_stock: number;
}

/** Payload untuk membuat asset. */
export interface CreateAssetPayload {
  asset_name: string;
  stock_quantity: number;
  category: AssetCategory;
}

/** Payload untuk memperbarui asset (semua field opsional). */
export type UpdateAssetPayload = Partial<CreateAssetPayload>;

/** Parameter query list asset. */
export interface ListAssetsParams {
  search?: string;
  category?: AssetCategory | '';
  page?: number;
  limit?: number;
}
