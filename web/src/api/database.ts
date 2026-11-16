import { http } from './client';
import type {
  QueryResult,
  TableRows,
  TableSchema,
  TableSummary,
} from '../types/database';

/** Endpoint untuk inspeksi database (semua bersifat read-only). */
export const databaseApi = {
  /** Daftar tabel pada schema public beserta jumlah baris. */
  tables(): Promise<TableSummary[]> {
    return http.get<TableSummary[]>('/database/tables');
  },

  /** Struktur tabel: kolom, constraint, index, dan enum. */
  schema(table: string): Promise<TableSchema> {
    return http.get<TableSchema>(
      `/database/tables/${encodeURIComponent(table)}/schema`,
    );
  },

  /** Baca baris mentah dari sebuah tabel. */
  rows(table: string, page: number, limit: number): Promise<TableRows> {
    return http.get<TableRows>(
      `/database/tables/${encodeURIComponent(table)}/rows?page=${page}&limit=${limit}`,
    );
  },

  /** Jalankan query SELECT (read-only). */
  query(sql: string): Promise<QueryResult> {
    return http.post<QueryResult>('/database/query', { sql });
  },
};
