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

@Controller('playlist')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Post()
  create(@Body() body: PlaylistCreateDto) {
    return this.playlistService.create(body);
  }

  @Get()
  findAll() {
    return this.playlistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.playlistService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: PlaylistUpdateDto,
  ) {
    return this.playlistService.update(id, body);
  }

  @Put(':id/songs')
  addSongs(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() { songIds }: PlaylistUpdateSongs,
  ) {
    return this.playlistService.addSongs(id, songIds);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.playlistService.remove(id);
  }
}
