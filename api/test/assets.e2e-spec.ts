import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { Asset } from '../src/assets/entities/asset.entity.js';

/**
 * E2E test endpoint /api/assets.
 *
 * Menjalankan terhadap database `asset_fumindo_test` (dikonfigurasi di
 * vitest.config.e2e.ts) sehingga data development tidak tersentuh.
 */
describe('Assets (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  const samplePayload = {
    asset_name: 'Kabel HDMI 2.1 (3 meter)',
    stock_quantity: 45,
    category: 'Consumable',
  };

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
    await dataSource.getRepository(Asset).clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/assets', () => {
    it('membuat asset baru dan mengembalikan 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/assets')
        .send(samplePayload)
        .expect(201);

      expect(response.body).toMatchObject(samplePayload);
      expect(response.body.asset_id).toBeGreaterThan(0);
      expect(response.body.created_at).toBeDefined();
    });

    it('menolak body dengan field tidak valid dengan 400', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: '', stock_quantity: -1, category: 'Salah' })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(Array.isArray(response.body.message)).toBe(true);
      expect(response.body.message.length).toBeGreaterThan(0);
    });

    it('menolak property tak dikenal dengan 400', async () => {
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ ...samplePayload, sneaky: 'value' })
        .expect(400);
    });
  });

  describe('GET /api/assets', () => {
    it('mengembalikan daftar asset dengan metadata pagination', async () => {
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset A', stock_quantity: 1, category: 'Consumable' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset B', stock_quantity: 2, category: 'Non-Consumable' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/assets')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
        total_pages: 1,
      });
    });

    it('memfilter berdasarkan kategori', async () => {
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset A', stock_quantity: 1, category: 'Consumable' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset B', stock_quantity: 2, category: 'Non-Consumable' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/assets?category=Consumable')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Consumable');
    });

    it('mencari asset berdasarkan nama (case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Kabel HDMI 2.1', stock_quantity: 1, category: 'Consumable' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/assets?search=kabel')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].asset_name).toBe('Kabel HDMI 2.1');
    });
  });

  describe('GET /api/assets/:id', () => {
    it('mengembalikan detail asset', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/assets')
        .send(samplePayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/assets/${created.body.asset_id}`)
        .expect(200);

      expect(response.body.asset_name).toBe(samplePayload.asset_name);
    });

    it('mengembalikan 404 untuk asset yang tidak ada', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/assets/999999')
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.path).toBe('/api/assets/999999');
    });
  });

  describe('PATCH /api/assets/:id', () => {
    it('memperbarui data asset', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/assets')
        .send(samplePayload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/api/assets/${created.body.asset_id}`)
        .send({ stock_quantity: 99 })
        .expect(200);

      expect(response.body.stock_quantity).toBe(99);
      expect(response.body.asset_name).toBe(samplePayload.asset_name);
    });

    it('mengembalikan 404 saat asset tidak ada', async () => {
      await request(app.getHttpServer())
        .patch('/api/assets/999999')
        .send({ stock_quantity: 1 })
        .expect(404);
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('menghapus asset dan mengembalikan 204', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/assets')
        .send(samplePayload)
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/assets/${created.body.asset_id}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/assets/${created.body.asset_id}`)
        .expect(404);
    });

    it('mengembalikan 404 saat asset tidak ada', async () => {
      await request(app.getHttpServer()).delete('/api/assets/999999').expect(404);
    });
  });

  describe('GET /api/assets/stats', () => {
    it('mengembalikan ringkasan agregat', async () => {
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset A', stock_quantity: 10, category: 'Consumable' })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/assets')
        .send({ asset_name: 'Asset B', stock_quantity: 5, category: 'Non-Consumable' })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/assets/stats')
        .expect(200);

      expect(response.body).toMatchObject({
        total_assets: 2,
        total_stock: 15,
        consumable: 1,
        non_consumable: 1,
      });
    });
  });

  describe('GET /api/health', () => {
    it('menyatakan layanan dan database sehat', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.database).toBe('up');
    });
  });
});
