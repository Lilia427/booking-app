// IMPORTANT: Sentry instrumentation must be imported before any other module
// so it can patch Node's http / express before AppModule loads.
import './instrument';

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './sentry.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  // /health is excluded from global prefix (needed for ALB health check)
  app.setGlobalPrefix('api', { exclude: ['health'] });

  // Register Sentry exception filter globally so unhandled/5xx errors are
  // captured and reported to Sentry with full stack traces and context.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapterHost.httpAdapter));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API running at http://localhost:${port}/api`);
}
bootstrap();
