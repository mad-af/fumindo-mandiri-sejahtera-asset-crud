import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 3001;

  // Prefix route, validasi input, dan format error.
  configureApp(app);

  // Mengizinkan frontend (Vite dev server) memanggil API ini.
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  // Dokumentasi API otomatis (Swagger UI).
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fumindo Asset API')
    .setDescription(
      'REST API management aset (stok & kategori) - Soal Tes Internship Fumindo',
    )
    .setVersion('1.0.0')
    .addTag('assets', 'CRUD data aset')
    .addTag('health', 'Health check aplikasi')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`API siap digunakan  ->  http://localhost:${port}/api`);
  logger.log(`Dokumentasi Swagger ->  http://localhost:${port}/api/docs`);
}

await bootstrap();
