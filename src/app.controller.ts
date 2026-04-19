import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // ALB health check — excluded from /api prefix via setGlobalPrefix
  @Get('health')
  health(): object {
    return { status: 'ok' };
  }
}
