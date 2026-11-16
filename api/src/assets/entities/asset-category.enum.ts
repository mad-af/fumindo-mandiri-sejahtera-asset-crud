/**
 * Enum kategori asset.
 *
 * Nilainya 1:1 dengan tipe enum native PostgreSQL `asset_category`
 * yang dibuat di `db/schema.sql`, sehingga integritas data dijaga
 * oleh database itu sendiri, bukan hanya oleh aplikasi.
 */
export enum AssetCategory {
  CONSUMABLE = 'Consumable',
  NON_CONSUMABLE = 'Non-Consumable',
}
