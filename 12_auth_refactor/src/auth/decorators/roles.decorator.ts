import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../../common/types/user-role';

/**
 * @Roles(...roles) — declares which user roles are allowed to call an endpoint.
 *
 * HOW IT WORKS:
 * Like @Public(), this uses SetMetadata() to attach data to the route handler.
 * The stored value is an array of UserRole values. RolesGuard reads this array
 * and compares it against req.user.role to decide whether to allow or deny.
 *
 * The ROLES_KEY constant ('roles') is the shared lookup key used by both
 * this decorator (to store) and RolesGuard (to read via Reflector).
 *
 * USAGE:
 *   // Only admins:
 *   @Roles(UserRole.ADMIN)
 *   @Delete(':id')
 *   remove() { ... }
 *
 *   // Any authenticated user (user OR admin):
 *   @Roles(UserRole.USER, UserRole.ADMIN)
 *   @Get()
 *   findAll() { ... }
 *
 *   // No @Roles decorator → RolesGuard allows any authenticated user through.
 *
 * HOW IT PAIRS WITH RolesGuard:
 *   @Roles stores:  metadata['roles'] = [UserRole.ADMIN]
 *   RolesGuard reads: reflector.getAllAndOverride('roles', [handler, class])
 *   RolesGuard checks: requiredRoles.includes(req.user.role)
 *
 * NOTE: @Roles enforces *authorization*. The user still needs a valid JWT
 * first (JwtAuthGuard handles that). A request without a token never reaches
 * RolesGuard — it is rejected by JwtAuthGuard with 401 before roles are checked.
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
