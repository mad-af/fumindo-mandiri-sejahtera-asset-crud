/* eslint-disable no-console */
import { DataSource } from 'typeorm';
import { Asset } from '../assets/entities/asset.entity.js';
import { AssetCategory } from '../assets/entities/asset-category.enum.js';

// Muat variabel dari .env (Node >= 20.12 memiliki process.loadEnvFile).
try {
  process.loadEnvFile();
} catch {
  // .env tidak ditemukan - memakai nilai default di bawah.
}

const SEED_DATA: Array<{
  asset_name: string;
  stock_quantity: number;
  category: AssetCategory;
}> = [
  {
    asset_name: 'Kabel HDMI 2.1 (3 meter)',
    stock_quantity: 45,
    category: AssetCategory.CONSUMABLE,
  },
  {
    asset_name: 'Mouse Wireless Logitech M330',
    stock_quantity: 18,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Keyboard Mechanical Keychron K2',
    stock_quantity: 12,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Kertas A4 80gr (rim)',
    stock_quantity: 120,
    category: AssetCategory.CONSUMABLE,
  },
  {
    asset_name: 'Toner Printer Canon PG-245',
    stock_quantity: 8,
    category: AssetCategory.CONSUMABLE,
  },
  {
    asset_name: 'Flashdisk 64GB Kingston',
    stock_quantity: 25,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Baterai AA isi ulang (paket 4)',
    stock_quantity: 60,
    category: AssetCategory.CONSUMABLE,
  },
  {
    asset_name: 'Monitor LG 24 inch IPS',
    stock_quantity: 5,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Kabel USB-C ke USB-A',
    stock_quantity: 75,
    category: AssetCategory.CONSUMABLE,
  },
  {
    asset_name: 'Webcam Logitech C270',
    stock_quantity: 9,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Stapler Heavy Duty',
    stock_quantity: 14,
    category: AssetCategory.NON_CONSUMABLE,
  },
  {
    asset_name: 'Papan tulis whiteboard kecil',
    stock_quantity: 7,
    category: AssetCategory.NON_CONSUMABLE,
  },
];

async function main() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USER ?? 'fumindo',
    password: process.env.DB_PASSWORD ?? 'fumindo123',
    database:
      process.env.DB_NAME ??
      (process.env.NODE_ENV === 'test'
        ? 'asset_fumindo_test'
        : 'asset_fumindo'),
    entities: [Asset],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('-> Terhubung ke database:', dataSource.options.database);

  const repository = dataSource.getRepository(Asset);
  const existing = await repository.count();

  if (existing > 0 && !process.argv.includes('--force')) {
    console.log(
      `-> Tabel asset sudah berisi ${existing} baris. Seed dilewati. ` +
        'Gunakan `npm run db:seed -- --force` untuk mereset data.',
    );
    await dataSource.destroy();
    return;
  }

  if (process.argv.includes('--force')) {
    await repository.clear();
    console.log('-> Data lama dibersihkan (--force)');
  }

  await repository.save(SEED_DATA);
  const total = await repository.count();

  console.log(`-> Seed selesai. Total ${total} asset di tabel.`);
  await dataSource.destroy();
}

main().catch((error) => {
  console.error('Seed gagal:', error);
  process.exit(1);
});
