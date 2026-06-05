import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';

/**
 * @CurrentUser() — a custom parameter decorator that injects the authenticated
 * user directly into a controller method argument.
 *
 * WHAT IS A PARAMETER DECORATOR?
 * NestJS has built-in parameter decorators like @Req(), @Body(), @Param().
 * createParamDecorator() lets you create your own. The callback receives:
 *   data — any value passed inside the decorator: @CurrentUser('id') → data = 'id'
 *   ctx  — the ExecutionContext (same object guards receive)
 *
 * WHAT DOES IT RETURN?
 * It reads req.user — the AuthUser object that JwtAuthGuard attached after
 * validating the JWT. The return value of the callback becomes the value
 * injected into the decorated parameter.
 *
 * USAGE:
 *   @Post()
 *   create(
 *     @Body() body: PlaylistCreateDto,
 *     @CurrentUser() user: AuthUser,   ← injects { id, username, role }
 *   ) {
 *     return this.playlistService.create(body, user);
 *   }
 *
 * WHY USE THIS INSTEAD OF @Req()?
 * @Req() gives you the raw Express Request object (req.user, req.params, etc.).
 * @CurrentUser() is a focused, typed shorthand — it expresses INTENT clearly
 * ("I want the current user") and avoids importing the Express Request type
 * everywhere. It also makes unit tests easier (mock the decorator, not the
 * whole request object).
 *
 * PREREQUISITE: JwtAuthGuard must run before this decorator is evaluated.
 * If the guard didn't populate req.user, this returns undefined.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();

    // req.user is set by JwtStrategy.validate() via Passport after JWT verification.
    return request.user;
  },
);
