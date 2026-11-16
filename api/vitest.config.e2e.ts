import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // File e2e memakai database yang sama, jadi jalankan berurutan
    // agar tidak saling mengosongkan tabel.
    fileParallelism: false,
    // E2E test memakai database terpisah agar data development utuh.
    // Nilai di sini mengalahkan nilai yang dimuat dari file .env.
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'asset_fumindo_test',
    },
  },
});
