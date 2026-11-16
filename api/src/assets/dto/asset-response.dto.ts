import { ApiProperty } from '@nestjs/swagger';
import { Asset } from '../entities/asset.entity.js';
import { AssetCategory } from '../entities/asset-category.enum.js';

/** Metadata pagination yang menyertai setiap response listing. */
export class PaginationMeta {
  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  total_pages: number;
}

/** Response listing asset: data + meta pagination. */
export class PaginatedAssets {
  @ApiProperty({ type: [Asset] })
  data: Asset[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}

/** Response satu asset. */
export class AssetResponse {
  @ApiProperty({ example: 1 })
  asset_id: number;

  @ApiProperty({ example: 'Kabel HDMI 2.1' })
  asset_name: string;

  @ApiProperty({ example: 25 })
  stock_quantity: number;

  @ApiProperty({ enum: AssetCategory })
  category: AssetCategory;

  @ApiProperty({ example: '2026-11-16T08:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2026-11-16T08:00:00.000Z' })
  updated_at: Date;
}
