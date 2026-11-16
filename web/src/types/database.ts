/** Ringkasan sebuah tabel. */
export interface TableSummary {
  table_name: string;
  row_count: number;
}

/** Informasi satu kolom tabel. */
export interface ColumnInfo {
  position: number;
  column_name: string;
  data_type: string;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
  character_maximum_length: number | null;
  is_primary_key: boolean;
  is_enum: boolean;
}

/** Constraint tabel (PRIMARY KEY, CHECK, FOREIGN KEY, UNIQUE). */
export interface ConstraintInfo {
  name: string;
  type: string;
  definition: string;
}

/** Index tabel. */
export interface IndexInfo {
  name: string;
  definition: string;
}

/** Tipe enum bawaan user beserta labelnya. */
export interface EnumInfo {
  type_name: string;
  labels: string[];
}

/** Struktur lengkap sebuah tabel. */
export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
  enums: EnumInfo[];
}

/** Hasil pembacaan baris mentah dari sebuah tabel. */
export interface TableRows {
  columns: string[];
  rows: unknown[][];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

/** Hasil eksekusi query SQL bebas. */
export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  duration_ms: number;
}
