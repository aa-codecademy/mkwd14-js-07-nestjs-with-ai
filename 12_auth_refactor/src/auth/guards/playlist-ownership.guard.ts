import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { AuthUser } from '../types/auth-user';
import { UserRole } from '../../common/types/user-role';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from '../../playlist/entities/playlist.entity';
import type { Repository } from 'typeorm';

/**
 * PlaylistOwnershipGuard — ensures a user can only modify their OWN playlists.
 *
 * WHAT PROBLEM DOES THIS SOLVE?
 * RolesGuard can restrict an endpoint to "USER or ADMIN only", but it can't
 * prevent user A from editing user B's playlist — both are authenticated USERs.
 * We need a second check: "does this particular user own this particular resource?"
 * That is called resource-level authorization (or object-level authorization).
 *
 * THE RULE THIS GUARD ENFORCES:
 *   ✅ ADMIN can modify any playlist (admins manage all content)
 *   ✅ USER can modify a playlist if they created it (ownerId === user.id)
 *   ❌ USER cannot modify a playlist that belongs to someone else → 403 Forbidden
 *
 * HOW IT WORKS:
 *   1. Read the authenticated user from req.user (populated by JwtAuthGuard).
 *   2. Read the playlist :id from the route parameter.
 *   3. Short-circuit: if the user is ADMIN, always allow.
 *   4. Query the database for a playlist WHERE id = :id AND ownerId = :userId.
 *      If that row exists → the user owns it → allow.
 *      If it doesn't → the playlist exists but belongs to someone else → 403.
 *
 * WHY DO WE QUERY THE DATABASE IN A GUARD?
 * Guards can be async and can inject services/repositories. Checking ownership
 * in the guard means the controller method never even runs if the user isn't
 * the owner — a clean separation of concerns. The alternative (checking
 * ownership inside the service) works but mixes access-control logic with
 * business logic.
 *
 * WHERE IT IS APPLIED:
 *   @UseGuards(PlaylistOwnershipGuard)   ← applied per endpoint, not globally
 *   @Patch(':id')
 *   update(...) { ... }
 *
 * NOTE: This guard runs AFTER JwtAuthGuard and RolesGuard (because it is
 * applied with @UseGuards on the method, not as a global guard). This means
 * req.user is already populated when this guard runs.
 */
@Injectable()
export class PlaylistOwnershipGuard implements CanActivate {
  constructor(
    // @InjectRepository is TypeORM's DI token for a repository.
    // We inject Playlist's repository so we can query the database here.
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ params: { id: string }; user: AuthUser }>();

    const user = request.user;
    const playlistId = request.params.id;

    // Admins bypass the ownership check — they can manage all playlists.
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Find a playlist whose id AND ownerId both match.
    // If the playlist exists but belongs to another user, findOne returns null
    // (because ownerId !== user.id) and we throw 403 below.
    const playlist = await this.playlistRepository.findOne({
      where: {
        id: playlistId,
        ownerId: user.id,
      },
      relations: { owner: true },
    });

    if (!playlist) {
      // Throw ForbiddenException (403) — do NOT reveal whether the playlist
      // exists at all, to avoid leaking information about other users' data.
      throw new ForbiddenException(
        'You do not have permissions to modify this playlist.',
      );
    }

    return true;
  }
}
