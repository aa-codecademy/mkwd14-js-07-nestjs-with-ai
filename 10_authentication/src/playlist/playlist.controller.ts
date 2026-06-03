/**
 * Playlist HTTP API.
 *
 * Same conventions as the other controllers: thin handlers, DTOs on
 * `@Body()`, `ParseUUIDPipe` on `:id` params, global `ValidationPipe`
 * does the rest.
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
} from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistCreateDto } from './dto/playlist-create.dto';
import { PlaylistUpdateDto } from './dto/playlist-update.dto';
import { PlaylistUpdateSongs } from './dto/playlist-update-songs.dto';
import { Playlist } from './entities/playlist.entity';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Playlist')
@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @ApiOperation({ summary: 'Create a new playlist' })
  @ApiCreatedResponse({
    description: 'Playlist has been successfully created',
    type: Playlist,
  })
  @Post()
  create(@Body() body: PlaylistCreateDto) {
    return this.playlistService.create(body);
  }

  @ApiOperation({ summary: 'List all playlists' })
  @ApiOkResponse({
    description: 'Playlists are successfully returned',
    type: Playlist,
    isArray: true,
  })
  @Get()
  findAll() {
    return this.playlistService.findAll();
  }

  @ApiOperation({ summary: 'Get a playlist by ID' })
  @ApiOkResponse({
    description: 'Playlist is successfully returned',
    type: Playlist,
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.playlistService.findOne(id);
  }

  @ApiOperation({ summary: 'Update a playlist' })
  @ApiOkResponse({
    description: 'Playlist has been successfully updated',
    type: Playlist,
  })
  @Patch(':id')
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
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.playlistService.remove(id);
  }
}
