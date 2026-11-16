import { registerAs } from '@nestjs/config';

/**
 * Konfigurasi database (namespace `database`).
 *
 * Nama database otomatis diganti ke `asset_fumindo_test` ketika
 * NODE_ENV=test, agar test e2e tidak menyentuh data development.
 */
export default registerAs('database', () => ({
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'fumindo',
  password: process.env.DB_PASSWORD ?? 'fumindo123',
  name:
    process.env.DB_NAME ??
    (process.env.NODE_ENV === 'test'
      ? 'asset_fumindo_test'
      : 'asset_fumindo'),
  logging: process.env.DB_LOGGING === 'true',
}));
