-- =====================================================================
--  DATABASE : asset_fumindo
--  TABEL    : asset
--  DESKRIPSI: Skema resmi tabel asset (source of truth).
--              TypeORM dijalankan dengan synchronize=false agar tidak
--              ada drift antara kode aplikasi dan skema database.
--  CARA JALANKAN: psql -h 127.0.0.1 -U fumindo -d asset_fumindo -f db/schema.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tipe enum untuk kategori asset
--    Nilai dibatasi di level database, bukan hanya di level aplikasi.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_category') THEN
    CREATE TYPE asset_category AS ENUM ('Consumable', 'Non-Consumable');
  END IF;
END$$;

-- ---------------------------------------------------------------------
-- 2. Tabel utama asset
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asset (
  asset_id       SERIAL       PRIMARY KEY,
  asset_name     VARCHAR(150) NOT NULL,
  stock_quantity INTEGER      NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  category       asset_category NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------
-- 3. Index untuk mendukung query listing (filter kategori & pencarian)
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_asset_category ON asset (category);
CREATE INDEX IF NOT EXISTS idx_asset_name    ON asset (asset_name);

-- ---------------------------------------------------------------------
-- 4. Trigger agar updated_at selalu terisi otomatis saat row di-update
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_asset_updated_at ON asset;
CREATE TRIGGER trg_asset_updated_at
  BEFORE UPDATE ON asset
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
