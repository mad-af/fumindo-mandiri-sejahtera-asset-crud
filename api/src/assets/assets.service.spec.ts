import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AssetsService } from './assets.service.js';
import { Asset } from './entities/asset.entity.js';
import { AssetCategory } from './entities/asset-category.enum.js';

function buildAsset(overrides: Partial<Asset> = {}): Asset {
  return Object.assign(new Asset(), {
    asset_id: 1,
    asset_name: 'Kabel HDMI 2.1',
    stock_quantity: 10,
    category: AssetCategory.CONSUMABLE,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('AssetsService', () => {
  let service: AssetsService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    createQueryBuilder: ReturnType<typeof vi.fn>;
  };
  let queryBuilder: {
    andWhere: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    skip: ReturnType<typeof vi.fn>;
    take: ReturnType<typeof vi.fn>;
    getManyAndCount: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    queryBuilder = {
      andWhere: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      take: vi.fn().mockReturnThis(),
      getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
    };

    repository = {
      create: vi.fn(),
      save: vi.fn(),
      findOne: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn().mockReturnValue(queryBuilder),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: getRepositoryToken(Asset), useValue: repository },
      ],
    }).compile();

    service = moduleRef.get(AssetsService);
  });

  describe('findAll', () => {
    it('mengembalikan data beserta metadata pagination', async () => {
      const items = [buildAsset(), buildAsset({ asset_id: 2 })];
      queryBuilder.getManyAndCount.mockResolvedValue([items, 12]);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        total: 12,
        page: 2,
        limit: 5,
        total_pages: 3,
      });
      expect(queryBuilder.skip).toHaveBeenCalledWith(5);
      expect(queryBuilder.take).toHaveBeenCalledWith(5);
    });

    it('memakai default page 1 dan limit 10 saat tidak diisi', async () => {
      await service.findAll({});

      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('menambahkan filter pencarian dan kategori', async () => {
      await service.findAll({
        search: 'kabel',
        category: AssetCategory.CONSUMABLE,
      });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(2);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'asset.asset_name ILIKE :search',
        { search: '%kabel%' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'asset.category = :category',
        { category: AssetCategory.CONSUMABLE },
      );
    });

    it('tidak menambahkan filter ketika pencarian kosong', async () => {
      await service.findAll({});

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('mengembalikan asset yang ditemukan', async () => {
      const asset = buildAsset();
      repository.findOne.mockResolvedValue(asset);

      await expect(service.findOne(1)).resolves.toBe(asset);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { asset_id: 1 },
      });
    });

    it('melempar NotFoundException bila asset tidak ada', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create', () => {
    it('menyimpan asset baru dengan data dari DTO', async () => {
      const created = buildAsset();
      repository.create.mockReturnValue(created);
      repository.save.mockResolvedValue(created);

      const result = await service.create({
        asset_name: 'Kabel HDMI 2.1',
        stock_quantity: 10,
        category: AssetCategory.CONSUMABLE,
      });

      expect(repository.create).toHaveBeenCalledWith({
        asset_name: 'Kabel HDMI 2.1',
        stock_quantity: 10,
        category: AssetCategory.CONSUMABLE,
      });
      expect(repository.save).toHaveBeenCalledWith(created);
      expect(result).toBe(created);
    });
  });

  describe('update', () => {
    it('memperbarui hanya field yang dikirim', async () => {
      const asset = buildAsset();
      repository.findOne.mockResolvedValue(asset);
      repository.save.mockResolvedValue(asset);

      await service.update(1, { stock_quantity: 42 });

      expect(asset.stock_quantity).toBe(42);
      expect(asset.asset_name).toBe('Kabel HDMI 2.1');
      expect(repository.save).toHaveBeenCalledWith(asset);
    });

    it('melempar NotFoundException bila asset tidak ada', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { stock_quantity: 1 })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('menghapus asset yang ada', async () => {
      const asset = buildAsset();
      repository.findOne.mockResolvedValue(asset);
      repository.remove.mockResolvedValue(asset);

      await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(asset);
    });

    it('melempar NotFoundException bila asset tidak ada', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
