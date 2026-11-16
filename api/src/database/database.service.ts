import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

/** Ringkasan sebuah tabel. */
export interface TableSummary {
  table_name: string;
  row_count: number;
}

/** Informasi satu kolom. */
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

/** Constraint pada tabel (PK, CHECK, FK, UNIQUE). */
export interface ConstraintInfo {
  name: string;
  type: string;
  definition: string;
}

/** Index pada tabel. */
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

/** Hasil eksekusi query SQL bebas (read-only). */
export interface QueryResult {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  duration_ms: number;
}

/** Batas maksimum baris yang dikembalikan query runner. */
const MAX_QUERY_ROWS = 500;

/** Keyword yang dilarang pada query runner. */
const FORBIDDEN_KEYWORDS =
  /\b(insert|update|delete|drop|alter|truncate|grant|revoke|copy|call|do|execute|vacuum|analyze|refresh|lock|listen|notify|pg_sleep|pg_read_file|pg_ls_dir)\b/i;

@Injectable()
export class DatabaseService {
  constructor(private readonly dataSource: DataSource) {}

  // -------------------------------------------------------------------
  // Daftar tabel
  // -------------------------------------------------------------------

  async listTables(): Promise<TableSummary[]> {
    const rows = (await this.dataSource.query(
      `SELECT c.relname AS table_name
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname`,
    )) as Array<{ table_name: string }>;

    const tables: TableSummary[] = [];

    for (const row of rows) {
      tables.push({
        table_name: row.table_name,
        row_count: await this.countRows(row.table_name),
      });
    }

    return tables;
  }

  // -------------------------------------------------------------------
  // Struktur tabel
  // -------------------------------------------------------------------

  async getSchema(table: string): Promise<TableSchema> {
    await this.assertTableExists(table);

    const columns = (await this.dataSource.query(
      `SELECT c.ordinal_position AS position,
              c.column_name,
              c.data_type,
              c.is_nullable,
              c.column_default,
              c.character_maximum_length
         FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = $1
        ORDER BY c.ordinal_position`,
      [table],
    )) as Array<{
      position: number;
      column_name: string;
      data_type: string;
      is_nullable: 'YES' | 'NO';
      column_default: string | null;
      character_maximum_length: number | null;
    }>;

    const primaryKeys = await this.getPrimaryKeyColumns(table);
    const enumTypes = await this.getEnumTypes();

    const columnInfo: ColumnInfo[] = columns.map((column) => ({
      ...column,
      is_primary_key: primaryKeys.includes(column.column_name),
      is_enum: column.data_type === 'USER-DEFINED',
    }));

    const constraints = (await this.dataSource.query(
      `SELECT con.conname AS name,
              con.contype::text AS type,
              pg_get_constraintdef(con.oid) AS definition
         FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public' AND rel.relname = $1
        ORDER BY con.conname`,
      [table],
    )) as ConstraintInfo[];

    const indexes = (await this.dataSource.query(
      `SELECT indexname AS name, indexdef AS definition
         FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1
        ORDER BY indexname`,
      [table],
    )) as IndexInfo[];

    return {
      table_name: table,
      columns: columnInfo,
      constraints,
      indexes,
      enums: enumTypes,
    };
  }

  // -------------------------------------------------------------------
  // Baris mentah
  // -------------------------------------------------------------------

  async getRows(
    table: string,
    page = 1,
    limit = 25,
  ): Promise<TableRows> {
    await this.assertTableExists(table);

    const quoted = this.quoteIdentifier(table);
    const total = await this.countRows(table);

    // Urutkan berdasarkan primary key bila ada, jika tidak pakai ctid.
    const primaryKeys = await this.getPrimaryKeyColumns(table);
    const orderBy =
      primaryKeys.length > 0
        ? primaryKeys.map((column) => this.quoteIdentifier(column)).join(', ')
        : 'ctid';

    const raw = await this.dataSource.query(
      `SELECT * FROM public.${quoted} ORDER BY ${orderBy} LIMIT $1 OFFSET $2`,
      [limit, (page - 1) * limit],
    );

    // Nama kolom diambil dari information_schema supaya tetap tersedia
    // walaupun tabel sedang kosong.
    const columns = await this.getColumnNames(table);
    const records = this.toRecords(raw);

    return {
      columns,
      rows: records.map((row) => columns.map((column) => row[column])),
      meta: {
        total,
        page,
        limit,
        total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  // -------------------------------------------------------------------
  // Query runner (read-only)
  // -------------------------------------------------------------------

  async runQuery(sql: string): Promise<QueryResult> {
    const statement = sql.trim().replace(/;+\s*$/, '').trim();

    if (!statement) {
      throw new BadRequestException('Query SQL tidak boleh kosong.');
    }

    if (!/^(select|with|table)\b/i.test(statement)) {
      throw new BadRequestException(
        'Hanya query SELECT yang diizinkan. Database Inspector bersifat read-only.',
      );
    }

    if (statement.includes(';')) {
      throw new BadRequestException(
        'Hanya satu statement SQL yang diizinkan per eksekusi.',
      );
    }

    if (FORBIDDEN_KEYWORDS.test(statement)) {
      throw new BadRequestException(
        'Query mengandung keyword yang tidak diizinkan untuk Database Inspector.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const startedAt = Date.now();

    try {
      await queryRunner.startTransaction();
      // Pengaman utama: transaksi READ ONLY membuat PostgreSQL menolak
      // setiap percobaan modifikasi data, termasuk data-modifying CTE.
      await queryRunner.query('SET TRANSACTION READ ONLY');
      await queryRunner.query(`SET LOCAL statement_timeout = '10s'`);

      const raw = await queryRunner.query(
        `SELECT * FROM (${statement}) AS __inspector LIMIT ${MAX_QUERY_ROWS}`,
      );

      await queryRunner.rollbackTransaction();

      const records = this.toRecords(raw);
      const columns = this.extractColumns(records);

      return {
        columns,
        rows: records.map((row) => columns.map((column) => row[column])),
        row_count: records.length,
        duration_ms: Date.now() - startedAt,
      };
    } catch (error) {
      await this.safeRollback(queryRunner);
      const message = error instanceof Error ? error.message : 'Query gagal.';
      throw new BadRequestException(`Query gagal: ${message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // -------------------------------------------------------------------
  // Helper
  // -------------------------------------------------------------------

  private async countRows(table: string): Promise<number> {
    const quoted = this.quoteIdentifier(table);
    const rows = (await this.dataSource.query(
      `SELECT COUNT(*)::int AS total FROM public.${quoted}`,
    )) as Array<{ total: number }>;

    return rows[0]?.total ?? 0;
  }

  private async assertTableExists(table: string): Promise<void> {
    const rows = (await this.dataSource.query(
      `SELECT c.relname
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = $1`,
      [table],
    )) as Array<{ relname: string }>;

    if (rows.length === 0) {
      throw new NotFoundException(`Tabel "${table}" tidak ditemukan.`);
    }
  }

  private async getPrimaryKeyColumns(table: string): Promise<string[]> {
    const rows = (await this.dataSource.query(
      `SELECT a.attname AS column_name
         FROM pg_constraint con
         JOIN pg_class rel ON rel.oid = con.conrelid
         JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
         JOIN pg_attribute a
           ON a.attrelid = rel.oid AND a.attnum = ANY(con.conkey)
        WHERE nsp.nspname = 'public'
          AND rel.relname = $1
          AND con.contype = 'p'`,
      [table],
    )) as Array<{ column_name: string }>;

    return rows.map((row) => row.column_name);
  }

  private async getEnumTypes(): Promise<EnumInfo[]> {
    const rows = (await this.dataSource.query(
      `SELECT t.typname AS type_name, e.enumlabel AS label
         FROM pg_type t
         JOIN pg_namespace n ON n.oid = t.typnamespace
         JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE n.nspname = 'public'
        ORDER BY t.typname, e.enumsortorder`,
    )) as Array<{ type_name: string; label: string }>;

    const grouped = new Map<string, string[]>();

    for (const row of rows) {
      const labels = grouped.get(row.type_name) ?? [];
      labels.push(row.label);
      grouped.set(row.type_name, labels);
    }

    return [...grouped.entries()].map(([type_name, labels]) => ({
      type_name,
      labels,
    }));
  }

  /** Escape identifier SQL dengan memakai double quote. */
  private quoteIdentifier(name: string): string {
    return `"${name.replace(/"/g, '""')}"`;
  }

  /**
   * TypeORM 1.x mengembalikan hasil query SELECT sebagai array of record
   * (bukan objek result pg). Helper ini menormalkan berbagai bentuk hasil.
   */
  private toRecords(raw: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(raw)) {
      return raw as Array<Record<string, unknown>>;
    }

    const result = raw as
      | { records?: unknown; rows?: unknown }
      | null
      | undefined;

    if (Array.isArray(result?.records)) {
      return result.records as Array<Record<string, unknown>>;
    }

    if (Array.isArray(result?.rows)) {
      return result.rows as Array<Record<string, unknown>>;
    }

    return [];
  }

  /** Ambil daftar nama kolom sebuah tabel sesuai urutan definisinya. */
  private async getColumnNames(table: string): Promise<string[]> {
    const rows = (await this.dataSource.query(
      `SELECT c.column_name
         FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = $1
        ORDER BY c.ordinal_position`,
      [table],
    )) as Array<{ column_name: string }>;

    return rows.map((row) => row.column_name);
  }

  /** Ambil daftar nama kolom dari hasil query. */
  private extractColumns(records: Array<Record<string, unknown>>): string[] {
    const first = records[0];
    return first ? Object.keys(first) : [];
  }

  private async safeRollback(queryRunner: {
    isTransactionActive?: boolean;
    rollbackTransaction: () => Promise<void>;
  }): Promise<void> {
    try {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
    } catch {
      // Abaikan - transaksi sudah berakhir atau tidak aktif.
    }
  }
}
