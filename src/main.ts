import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { GlobalHttpExceptionFilter } from './http-exception.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();