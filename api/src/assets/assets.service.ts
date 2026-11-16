import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity.js';
import { CreateAssetDto, QueryAssetsDto, UpdateAssetDto } from './dto/asset.dto.js';
import { PaginatedAssets } from './dto/asset-response.dto.js';

/** Ringkasan agregat untuk kartu statistik di dashboard. */
export interface AssetStats {
  total_assets: number;
  total_stock: number;
  consumable: number;
  non_consumable: number;
  low_stock: number;
}

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
  ) {}

  /**
   * Listing asset dengan pencarian, filter kategori, dan pagination.
   */
  async findAll(query: QueryAssetsDto): Promise<PaginatedAssets> {
    const { search, category } = query;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.assetRepository.createQueryBuilder('asset');

    if (search) {
      qb.andWhere('asset.asset_name ILIKE :search', { search: `%${search}%` });
    }

    if (category) {
      qb.andWhere('asset.category = :category', { category });
    }

    qb.orderBy('asset.asset_id', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
      },
    };
  }

  /** Agregat untuk kartu ringkasan dashboard. */
  async getStats(): Promise<AssetStats> {
    const raw = await this.assetRepository
      .createQueryBuilder('asset')
      .select('COUNT(*)::int', 'total_assets')
      .addSelect('COALESCE(SUM(asset.stock_quantity), 0)::int', 'total_stock')
      .addSelect(
        `COUNT(*) FILTER (WHERE asset.category = 'Consumable')::int`,
        'consumable',
      )
      .addSelect(
        `COUNT(*) FILTER (WHERE asset.category = 'Non-Consumable')::int`,
        'non_consumable',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE asset.stock_quantity <= 10)::int',
        'low_stock',
      )
      .getRawOne<AssetStats>();

    return (
      raw ?? {
        total_assets: 0,
        total_stock: 0,
        consumable: 0,
        non_consumable: 0,
        low_stock: 0,
      }
    );
  }

  /** Mengambil satu asset berdasarkan id. */
  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({ where: { asset_id: id } });

    if (!asset) {
      throw new NotFoundException(`Asset dengan id ${id} tidak ditemukan`);
    }

    return asset;
  }

  /** Membuat asset baru. */
  async create(dto: CreateAssetDto): Promise<Asset> {
    const asset = this.assetRepository.create({
      asset_name: dto.asset_name,
      stock_quantity: dto.stock_quantity,
      category: dto.category,
    });

    return this.assetRepository.save(asset);
  }

  /** Memperbarui asset yang sudah ada. */
  async update(id: number, dto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOne(id);

    if (dto.asset_name !== undefined) {
      asset.asset_name = dto.asset_name;
    }
    if (dto.stock_quantity !== undefined) {
      asset.stock_quantity = dto.stock_quantity;
    }
    if (dto.category !== undefined) {
      asset.category = dto.category;
    }

    return this.assetRepository.save(asset);
  }

  /** Menghapus asset. */
  async remove(id: number): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetRepository.remove(asset);
  }
}
