import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '../../common/types/user-role';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser } from '../types/auth-user';

/**
 * RolesGuard — enforces Role-Based Access Control (RBAC) on endpoints.
 *
 * WHAT IS RBAC?
 * Role-Based Access Control restricts actions based on the user's assigned
 * role. In this app we have two roles: USER and ADMIN.
 *   - USER  → can read playlists, create/edit their own playlists
 *   - ADMIN → can also create/delete songs, albums, artists; delete any playlist
 *
 * HOW IT WORKS (step by step):
 *   1. A developer marks an endpoint with @Roles(UserRole.ADMIN).
 *   2. NestJS stores that metadata on the handler function via Reflector.
 *   3. On every request, RolesGuard reads that metadata.
 *   4. If no roles are required → allow (any authenticated user can proceed).
 *   5. If roles are required → compare req.user.role against the list.
 *      Match → allow. No match → throw 403 Forbidden.
 *
 * WHERE DOES req.user COME FROM?
 * JwtAuthGuard (which runs BEFORE RolesGuard) validates the JWT and calls
 * JwtStrategy.validate(), which returns an AuthUser and attaches it to req.user.
 * By the time RolesGuard runs, we can trust req.user is already populated.
 *
 * WHY IS THIS A SEPARATE GUARD FROM JwtAuthGuard?
 * Single Responsibility: JwtAuthGuard answers "Is this request authenticated?"
 * (is there a valid token?). RolesGuard answers "Is this user authorized?"
 * (do they have the right role?). Keeping them separate means you can apply
 * role checks independently of authentication checks.
 *
 * GUARD EXECUTION ORDER:
 * Guards registered via APP_GUARD in AppModule run in registration order.
 * JwtAuthGuard is registered first, so it runs before RolesGuard — this is
 * important because RolesGuard reads req.user which JwtAuthGuard populates.
 *
 * HOW TO USE ON AN ENDPOINT:
 *   @Roles(UserRole.ADMIN)
 *   @Delete(':id')
 *   remove(@Param('id') id: string) { ... }
 *
 * HOW TO USE ON A WHOLE CONTROLLER:
 *   @Roles(UserRole.ADMIN)
 *   @Controller('admin')
 *   export class AdminController { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Read the roles array attached by @Roles(...) to the handler or the class.
    // getAllAndOverride checks the handler first, then the class — handler wins.
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles decorator on this endpoint → no role restriction.
    // Any authenticated user (validated by JwtAuthGuard) can proceed.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: AuthUser }>();

    const user = request.user;

    // Defensive check: if JwtAuthGuard didn't run or failed to populate user,
    // deny access rather than crash on user.role below.
    if (!user) {
      return false;
    }

    // requiredRoles.includes checks if the user's single role appears in the
    // list of roles that are allowed on this endpoint.
    // Example: @Roles(UserRole.ADMIN) → only admins pass; users get 403.
    return requiredRoles.includes(user.role);
  }
}
