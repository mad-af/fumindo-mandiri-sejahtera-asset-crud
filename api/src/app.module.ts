import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsModule } from './assets/assets.module.js';
import configuration from './config/configuration.js';
import { validate } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [],
        autoLoadEntities: true,
        // Skema tabel dikelola oleh db/schema.sql (source of truth).
        // synchronize: false mencegah TypeORM mengubah/menghapus kolom.
        synchronize: false,
        logging: configService.get<boolean>('database.logging'),
      }),
    }),
    AssetsModule,
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
