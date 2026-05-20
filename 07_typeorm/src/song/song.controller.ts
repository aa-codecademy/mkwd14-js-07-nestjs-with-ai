/**
 * Song HTTP API.
 *
 * Same pattern as `ArtistController`: thin handlers, DTOs declared on
 * `@Body()`, validation handled by the global `ValidationPipe`.
 *
 * Notice the use of `@Param('id', ParseUUIDPipe)`: a built-in pipe that
 * BOTH parses (returns the value) AND validates (throws 400 if not a UUID).
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { SongService } from './song.service';
import { SongCreateDto } from './dto/song-create.dto';
import { SongDto } from './dto/song.dto';
import { SongUpdateDto } from './dto/song-update.dto';
import type { Song } from './song.entity';

@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get()
  getSongs(): Promise<Song[]> {
    return this.songService.getSongs();
  }

  @Get(':id')
  getSongById(@Param('id', ParseUUIDPipe) id: string): Promise<Song> {
    return this.songService.getSongById(id);
  }

  @Post()
  createSong(@Body() body: SongCreateDto): Promise<Song> {
    return this.songService.createSong(body);
  }

  @Patch(':id')
  updateSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SongUpdateDto,
  ): Promise<Song | null> {
    return this.songService.updateSong(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteSong(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.songService.deleteSong(id);
  }
}
