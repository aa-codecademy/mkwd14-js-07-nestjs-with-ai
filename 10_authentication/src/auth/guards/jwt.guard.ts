import { Injectable, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — the door-bouncer for protected endpoints.
 *
 * WHAT IS A GUARD?
 * Guards implement the CanActivate interface. NestJS runs them BEFORE the
 * controller method. If canActivate() returns false (or throws), the request
 * is rejected immediately (401 Unauthorized) and the controller is never called.
 * Think of them as pre-flight checks on every incoming request.
 *
 * WHAT DOES AuthGuard('jwt') DO UNDER THE HOOD?
 *   1. Reads the Authorization header: "Bearer <token>"
 *      (the extraction strategy is configured in JwtStrategy's constructor via
 *      ExtractJwt.fromAuthHeaderAsBearerToken)
 *   2. Verifies the token's signature against JWT_SECRET from the environment.
 *   3. Checks the token hasn't expired (ignoreExpiration: false in JwtStrategy).
 *   4. Calls JwtStrategy.validate(payload) → returns an AuthUser object.
 *   5. Attaches that object to req.user so controllers can access it.
 *
 * WHY EXTEND IT INSTEAD OF USING AuthGuard('jwt') DIRECTLY?
 *   Having our own named class (JwtAuthGuard) lets us:
 *     - Add custom logic later (role checks, rate limits, logging) in one place.
 *     - Use it as a type in tests (easy to mock).
 *     - Apply it with @UseGuards(JwtAuthGuard) which reads clearly.
 *
 * HOW TO USE ON AN ENDPOINT:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@Req() req) { return req.user; }
 *
 * HOW TO USE FOR AN ENTIRE CONTROLLER:
 *   @UseGuards(JwtAuthGuard)
 *   @Controller('playlist')
 *   export class PlaylistController { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor() {
    super();
  }

  // canActivate is called by the NestJS pipeline for every guarded request.
  // We delegate to the parent AuthGuard which runs the full Passport JWT flow.
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
