import {
  Injectable,
  Logger,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';

// NestInterceptor sits in the request/response pipeline and can run logic
// both BEFORE a route handler executes and AFTER it completes (or throws).
// This makes interceptors ideal for cross-cutting concerns like logging,
// response transformation, caching, and timing — without touching individual
// controllers or services.
//
// Execution order relative to other NestJS building blocks:
//   Middleware → Guard → Interceptor (before) → Pipe → Controller
//   → Interceptor (after / tap) → Exception filter (on error)
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // NestJS built-in Logger scoped to 'HTTP' — the scope string appears as a
  // prefix in log output, making it easy to filter logs by category.
  private readonly logger = new Logger('HTTP');

  // intercept() is called for every request that passes through this interceptor.
  // context gives access to the underlying platform (HTTP/WebSocket/RPC) and its
  // request/response objects.
  // next.handle() returns an Observable that, when subscribed, runs the route handler.
  // The interceptor must return an Observable — either next.handle() directly,
  // or a modified version of it (via pipe/map/catchError etc.).
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // switchToHttp() narrows the execution context to HTTP — required to access
    // the Express Request/Response objects. For WebSockets you'd use switchToWs().
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url } = req;

    const start = Date.now();

    // next.handle() triggers the route handler and returns an Observable of the result.
    // tap() is an RxJS side-effect operator — it fires a callback when the observable
    // emits (i.e. after the response is ready) without modifying the emitted value.
    // This is the "after" half of the interceptor: the route has already run,
    // the status code has been set, and we can now measure the full duration.
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} ${res.statusCode} - ${ms}ms`);
      }),
    );
  }
}
