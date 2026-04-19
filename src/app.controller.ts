import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Public service info — excluded from /api prefix via setGlobalPrefix
  @Get()
  getRoot(): object {
    return {
      service: 'Booking API',
      status: 'ok',
      version: '1.0.0',
      endpoints: {
        api: '/api',
        health: '/health',
        reservations: '/api/reservation',
        admin: '/api/admin',
      },
      hello: this.appService.getHello(),
    };
  }

  // ALB health check — excluded from /api prefix via setGlobalPrefix
  @Get('health')
  health(): object {
    return { status: 'ok' };
  }
}
