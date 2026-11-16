import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetCategory } from '../entities/asset-category.enum.js';

/** Body untuk membuat asset baru. */
export class CreateAssetDto {
  @ApiProperty({
    example: 'Kabel HDMI 2.1',
    maxLength: 150,
    description: 'Nama asset, maksimal 150 karakter',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  asset_name: string;

  @ApiProperty({ example: 25, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock_quantity: number;

  @ApiProperty({
    enum: AssetCategory,
    example: AssetCategory.CONSUMABLE,
    description: 'Kategori asset: Consumable atau Non-Consumable',
  })
  @IsEnum(AssetCategory)
  category: AssetCategory;
}

/** Body untuk memperbarui asset (semua field opsional). */
export class UpdateAssetDto {
  @ApiPropertyOptional({
    example: 'Kabel HDMI 2.1 - 3 meter',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  asset_name?: string;

  @ApiPropertyOptional({ example: 30, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock_quantity?: number;

  @ApiPropertyOptional({ enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;
}

/** Query parameter untuk listing asset (filter + pagination). */
export class QueryAssetsDto {
  @ApiPropertyOptional({
    example: 'kabel',
    description: 'Pencarian nama asset (case-insensitive, partial match)',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({ enum: AssetCategory })
  @IsOptional()
  @IsEnum(AssetCategory)
  category?: AssetCategory;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
