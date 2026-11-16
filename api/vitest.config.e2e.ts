import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // E2E test memakai database terpisah agar data development utuh.
    // Nilai di sini mengalahkan nilai yang dimuat dari file .env.
    env: {
      NODE_ENV: 'test',
      DB_NAME: 'asset_fumindo_test',
    },
  },
});
