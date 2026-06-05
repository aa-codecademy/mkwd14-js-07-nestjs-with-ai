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

@Injectable()
export class PlaylistOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ params: { id: string }; user: AuthUser }>();

    const user = request.user;
    const playlistId = request.params.id;

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    const playlist = await this.playlistRepository.findOne({
      where: {
        id: playlistId,
        ownerId: user.id,
      },
      relations: { owner: true },
    });

    if (!playlist) {
      throw new ForbiddenException(
        'You do not have permissions to modify this playlist.',
      );
    }

    return true;
  }
}
