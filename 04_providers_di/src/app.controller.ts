/** Same cross-cutting routes as module 03 — redirects, health JSON, optional request debugging. */
import { Controller, Get, Redirect, Headers, Ip } from '@nestjs/common';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller()
export class AppController {
  /** External redirect — handy pattern for pointing `/docs` at vendor documentation. */
  @Get('docs')
  @Redirect('https://docs.nestjs.com/controllers', 302)
  redirectToDocs(): void {}

  /** Welcome URL redirects to `/health` for predictable monitoring probes. */
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

  /** Shows header + inferred IP — compare with module `03` same endpoint while refactoring services. */
  @Get('request-info')
  requestInfo(@Headers('user-agent') userAgent: string, @Ip() ip: string) {
    return {
      userAgent,
      ip,
    };
  }
}
