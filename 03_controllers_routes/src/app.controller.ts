/**
 * App-wide routes: redirects, health check, and simple request metadata.
 * `@Controller()` with no prefix → paths are `/docs`, `/health`, etc.
 */
import { Controller, Get, Redirect, Headers, Ip } from '@nestjs/common';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}

@Controller()
export class AppController {
  /** Browser or client hits `/docs` → HTTP redirect to official Nest documentation. */
  @Get('docs')
  @Redirect('https://docs.nestjs.com/controllers', 302)
  redirectToDocs(): void {}

  /** Root URL redirects to `/health` so unauthenticated checks always hit a stable JSON endpoint. */
  @Get()
  @Redirect('/health', 302)
  root(): void {}

  /** Simple liveness payload — useful for uptime monitors and demos. */
  @Get('health')
  health(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  /**
   * Demonstrates reading headers and client IP via decorators instead of raw `req`.
   * `@Headers('user-agent')` extracts one header; `@Ip()` uses the configured trust proxy behavior.
   */
  @Get('request-info')
  requestInfo(@Headers('user-agent') userAgent: string, @Ip() ip: string) {
    return {
      userAgent,
      ip,
    };
  }
}
