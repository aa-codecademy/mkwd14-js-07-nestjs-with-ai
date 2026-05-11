import { Controller, Get, Redirect, Headers, Ip } from '@nestjs/common';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller()
export class AppController {
  @Get('docs')
  @Redirect('https://docs.nestjs.com/controllers', 302)
  redirectToDocs(): void {}

  @Get()
  @Redirect('/health', 302)
  root(): void {}

  @Get('health')
  health(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  @Get('request-info')
  requestInfo(@Headers('user-agent') userAgent: string, @Ip() ip: string) {
    return {
      userAgent,
      ip,
    };
  }
}
