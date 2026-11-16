import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Asset } from '../src/assets/entities/asset.entity.js';
import { AssetCategory } from '../src/assets/entities/asset-category.enum.js';

/**
 * E2E test untuk modul Database Inspector.
 *
 * Semua endpoint di modul ini bersifat read-only: isinya dibaca langsung
 * dari PostgreSQL tanpa melewati layer ORM asset.
 */
describe('Database (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    const repository = dataSource.getRepository(Asset);
    await repository.clear();
    await repository.save([
      {
        asset_name: 'Kabel HDMI 2.1',
        stock_quantity: 45,
        category: AssetCategory.CONSUMABLE,
      },
      {
        asset_name: 'Mouse Wireless',
        stock_quantity: 8,
        category: AssetCategory.NON_CONSUMABLE,
      },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/database/tables', () => {
    it('mengembalikan daftar tabel beserta jumlah baris', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/database/tables')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      const assetTable = response.body.find(
        (table: { table_name: string }) => table.table_name === 'asset',
      );

      expect(assetTable).toBeDefined();
      expect(assetTable.row_count).toBe(2);
    });
  });

  describe('GET /api/database/tables/:table/schema', () => {
    it('mengembalikan kolom, constraint, index, dan enum', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/database/tables/asset/schema')
        .expect(200);

      const columnNames = response.body.columns.map(
        (column: { column_name: string }) => column.column_name,
      );

      expect(columnNames).toEqual([
        'asset_id',
        'asset_name',
        'stock_quantity',
        'category',
        'created_at',
        'updated_at',
      ]);

      const assetId = response.body.columns.find(
        (column: { column_name: string }) => column.column_name === 'asset_id',
      );

      expect(assetId.is_primary_key).toBe(true);
      expect(assetId.is_nullable).toBe('NO');

      const category = response.body.columns.find(
        (column: { column_name: string }) => column.column_name === 'category',
      );

      expect(category.is_enum).toBe(true);

      expect(
        response.body.constraints.some((constraint: { definition: string }) =>
          constraint.definition.includes('PRIMARY KEY'),
        ),
      ).toBe(true);

      expect(
        response.body.constraints.some((constraint: { definition: string }) =>
          constraint.definition.includes('stock_quantity >= 0'),
        ),
      ).toBe(true);

      expect(response.body.indexes.length).toBeGreaterThan(0);

      const enumType = response.body.enums.find(
        (item: { type_name: string }) => item.type_name === 'asset_category',
      );

      expect(enumType.labels).toContain('Consumable');
      expect(enumType.labels).toContain('Non-Consumable');
    });

    it('mengembalikan 404 untuk tabel yang tidak ada', async () => {
      await request(app.getHttpServer())
        .get('/api/database/tables/tidak_ada/schema')
        .expect(404);
    });
  });

  describe('GET /api/database/tables/:table/rows', () => {
    it('mengembalikan baris mentah beserta metadata pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/database/tables/asset/rows?page=1&limit=10')
        .expect(200);

      expect(response.body.columns).toEqual([
        'asset_id',
        'asset_name',
        'stock_quantity',
        'category',
        'created_at',
        'updated_at',
      ]);
      expect(response.body.rows).toHaveLength(2);
      expect(response.body.rows[0][1]).toBe('Kabel HDMI 2.1');
      expect(response.body.meta).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('menerapkan pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/database/tables/asset/rows?page=2&limit=1')
        .expect(200);

      expect(response.body.rows).toHaveLength(1);
      expect(response.body.meta).toMatchObject({ page: 2, total_pages: 2 });
    });
  });

  describe('POST /api/database/query', () => {
    it('menjalankan query SELECT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: 'SELECT asset_name FROM asset ORDER BY asset_id' })
        .expect(201);

      expect(response.body.columns).toEqual(['asset_name']);
      expect(response.body.rows).toHaveLength(2);
      expect(response.body.row_count).toBe(2);
      expect(response.body.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('menolak query yang bukan SELECT', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: 'DELETE FROM asset' })
        .expect(400);

      expect(response.body.message).toContain('read-only');
    });

    it('menolak lebih dari satu statement', async () => {
      await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: 'SELECT 1; DROP TABLE asset' })
        .expect(400);
    });

    it('menolak query kosong', async () => {
      await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: '   ' })
        .expect(400);
    });

    it('menolak statement yang menulis ke database', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: "WITH x AS (DELETE FROM asset RETURNING *) SELECT * FROM x" })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
    });

    it('tidak mengubah data tabel setelah query SELECT', async () => {
      await request(app.getHttpServer())
        .post('/api/database/query')
        .send({ sql: 'SELECT * FROM asset' })
        .expect(201);

      const total = await dataSource.getRepository(Asset).count();
      expect(total).toBe(2);
    });
  });
});
