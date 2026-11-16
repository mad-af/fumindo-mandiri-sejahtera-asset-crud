import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // Proxy meneruskan request /api dari dev server ke backend NestJS,
    // sehingga frontend tetap memakai path relatif (tanpa masalah CORS).
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
