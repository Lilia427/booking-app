import './instrument';

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './sentry.filter';
import { UserService } from './admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-datadog-origin',
      'x-datadog-trace-id',
      'x-datadog-parent-id',
      'x-datadog-sampling-priority',
      'x-datadog-sampled',
      'sentry-trace',
      'baggage',
      'traceparent',
      'tracestate',
    ].join(','),
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapterHost.httpAdapter));

  const userService = app.get(UserService);
  await userService.ensureDefaultAdminFromEnv();

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API running at http://localhost:${port}/api`);
}
bootstrap();
