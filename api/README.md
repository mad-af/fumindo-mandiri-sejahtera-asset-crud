# API &mdash; Manajemen Aset (NestJS)

Backend REST API untuk CRUD tabel `asset` pada database PostgreSQL `asset_fumindo`.

Dokumentasi lengkap (setup, ERD, tabel endpoint) tersedia di
[README.md](../README.md) di root repository.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run db:setup     # buat database + skema (dari folder api/)
npm run db:seed      # opsional: data contoh
npm run start:dev
```

Swagger UI: <http://localhost:3001/api/docs>

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run start:dev` | Dev server dengan watch mode |
| `npm run build` | Build ke `dist/` |
| `npm run start:prod` | Jalankan hasil build |
| `npm test` | Unit test (Vitest) |
| `npm run test:e2e` | E2E test (Supertest, database `asset_fumindo_test`) |
| `npm run test:cov` | Unit test + laporan coverage |
| `npm run lint` | Lint (oxlint) |
| `npm run format` | Format kode (Prettier) |
| `npm run db:setup` | Buat role + database + skema |
| `npm run db:seed` | Isi data contoh |
| `npm run db:reset` | Reset isi tabel lalu seed ulang |

## Struktur Modul

| Modul | Tanggung jawab |
|---|---|
| `assets` | Controller, service, entity, dan DTO untuk CRUD asset |
| `common/filters` | Normalisasi seluruh response error |
| `config` | Pemuatan & validasi environment variable |
| `database` | Script seed data contoh |
| `health` | Health check aplikasi dan koneksi database |
