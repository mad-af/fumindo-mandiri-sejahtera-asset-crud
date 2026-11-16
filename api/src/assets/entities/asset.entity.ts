import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetCategory } from './asset-category.enum.js';

/**
 * Entitas `asset` - pemetaan 1:1 terhadap tabel `asset` di PostgreSQL.
 *
 * Nama property sengaja memakai snake_case (asset_id, asset_name,
 * stock_quantity) supaya payload API persis sama dengan nama field
 * pada tabel dan sama dengan spesifikasi soal.
 */
@Entity({ name: 'asset' })
export class Asset {
  @PrimaryGeneratedColumn({ name: 'asset_id', type: 'int' })
  asset_id: number;

  @Column({ name: 'asset_name', type: 'varchar', length: 150 })
  asset_name: string;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stock_quantity: number;

  @Column({
    type: 'enum',
    enum: AssetCategory,
    enumName: 'asset_category',
  })
  category: AssetCategory;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;
}
