import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

/**
 * Konfigurasi global aplikasi.
 *
 * Dipakai oleh `main.ts` sekaligus test e2e agar keduanya memakai
 * pipeline yang identik (prefix route, validasi input, dan format error).
 */
export function configureApp(app: INestApplication): void {
  // Seluruh endpoint berada di bawah prefix /api
  app.setGlobalPrefix('api');

  // Validasi input global: whitelist + tolak property tak dikenal.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Format error response yang konsisten untuk semua endpoint.
  app.useGlobalFilters(new AllExceptionsFilter());
}
