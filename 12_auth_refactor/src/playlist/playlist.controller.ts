/**
 * PlaylistController — demonstrates all three layers of access control:
 *
 *   Layer 1 — Authentication (global JwtAuthGuard via APP_GUARD in AppModule)
 *     All endpoints here require a valid JWT. No @UseGuards(JwtAuthGuard) needed
 *     because it runs globally. A request without a token gets 401 before this
 *     controller is touched.
 *
 *   Layer 2 — Role authorization (@Roles + global RolesGuard)
 *     @Roles(UserRole.USER, UserRole.ADMIN) → any authenticated user can call it.
 *     @Roles(UserRole.ADMIN) → only admins. Regular users get 403 Forbidden.
 *     Handled by RolesGuard (also registered globally in AppModule).
 *
 *   Layer 3 — Resource ownership (@UseGuards(PlaylistOwnershipGuard))
 *     Applied PER ENDPOINT with @UseGuards(). Checks that the authenticated user
 *     is the owner of the specific playlist being modified (or is an admin).
 *     Without this, any logged-in user could edit any other user's playlist.
 *
 * KEY DECORATOR: @CurrentUser()
 *   Injects req.user (the authenticated AuthUser) directly as a parameter.
 *   Used on create() so the service knows which user owns the new playlist.
 *
 * The endpoint that earns its own teaching moment is `PUT /:id/songs`.
 * See the comment on `addSongs` below for why it's a `PUT` instead of a
 * `PATCH` or `POST`.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistCreateDto } from './dto/playlist-create.dto';
import { PlaylistUpdateDto } from './dto/playlist-update.dto';
import { PlaylistUpdateSongs } from './dto/playlist-update-songs.dto';
import { Playlist } from './entities/playlist.entity';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/types/user-role';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PlaylistOwnershipGuard } from '../auth/guards/playlist-ownership.guard';

@ApiTags('Playlist')
@ApiBearerAuth('access-token')
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @ApiOperation({ summary: 'Create a new playlist' })
  @ApiCreatedResponse({
    description: 'Playlist has been successfully created',
    type: Playlist,
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post()
  create(@Body() body: PlaylistCreateDto, @CurrentUser() user: AuthUser) {
    return this.playlistService.create(body, user);
  }

  @ApiOperation({ summary: 'List all playlists' })
  @ApiOkResponse({
    description: 'Playlists are successfully returned',
    type: Playlist,
    isArray: true,
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get()
  findAll() {
    return this.playlistService.findAll();
  }

  @ApiOperation({ summary: 'Get a playlist by ID' })
  @ApiOkResponse({
    description: 'Playlist is successfully returned',
    type: Playlist,
  })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.playlistService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a playlist' })
  @ApiOkResponse({
    description: 'Playlist has been successfully updated',
    type: Playlist,
  })
  @UseGuards(PlaylistOwnershipGuard)
  @Patch(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateDto,
  ) {
    return this.playlistService.update(id, body);
  }

  /**
   * `PUT /playlist/:id/songs` — REPLACE the playlist's song list with the
   * given `songIds`.
   *
   * Why `PUT` instead of `PATCH` or `POST`?
   *   - REST treats the song collection as a SUB-RESOURCE of the playlist.
   *   - `PUT` semantics: the request body fully represents the desired state
   *     of that sub-resource. The server REPLACES it. Idempotent.
   *   - `PATCH` would mean "partial update" (e.g. "add these, remove those").
   *     If you want add-only or remove-only, design them as separate
   *     `POST /:id/songs` + `DELETE /:id/songs/:songId` endpoints.
   *
   * Destructuring `{ songIds }` directly in the parameter signature is a
   * small ergonomic win — the handler signature documents exactly which
   * fields it needs.
   */
  @ApiOperation({ summary: 'Replace songs in a playlist' })
  @ApiOkResponse({
    description: 'Playlist songs have been successfully replaced',
    type: Playlist,
  })
  @UseGuards(PlaylistOwnershipGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Put(':id/songs')
  addSongs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { songIds }: PlaylistUpdateSongs,
  ) {
    return this.playlistService.addSongs(id, songIds);
  }

  @ApiOperation({ summary: 'Delete a playlist' })
  @ApiNoContentResponse({
    description: 'Playlist has been successfully deleted',
  })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.playlistService.remove(id);
  }
}
