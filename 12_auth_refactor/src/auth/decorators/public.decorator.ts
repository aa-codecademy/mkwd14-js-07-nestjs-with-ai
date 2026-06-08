import { SetMetadata } from '@nestjs/common';

/**
 * @Public() — marks an endpoint (or entire controller) as accessible without
 * a JWT token. Use it on routes that must be reachable before a user has logged in.
 *
 * HOW IT WORKS:
 * This decorator calls NestJS's built-in SetMetadata(), which attaches a
 * key-value pair to the route handler's metadata store.
 *
 * JwtAuthGuard then reads this metadata before deciding whether to run the
 * full Passport JWT validation:
 *
 *   if (isPublic) return true;        ← skip auth entirely
 *   return super.canActivate(context); ← run Passport JWT validation
 *
 * The constant IS_PUBLIC_KEY ('isPublic') is the lookup key that JwtAuthGuard
 * uses with Reflector.getAllAndOverride() to read the metadata. Keeping the
 * key in this file means the decorator and the guard share the same string
 * without either one knowing the other's internals.
 *
 * USAGE:
 *   // Mark a single endpoint as public:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 *
 *   // Mark ALL endpoints in a controller as public:
 *   @Public()
 *   @Controller('auth')
 *   export class AuthController { ... }
 *
 * WHY NOT JUST SKIP @UseGuards?
 * We register JwtAuthGuard as a GLOBAL guard in AppModule (using APP_GUARD).
 * That means it runs on EVERY route automatically. We can't un-apply a global
 * guard per route — but we CAN use metadata to tell the guard to skip itself.
 * @Public() is the escape hatch for the global guard pattern.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
