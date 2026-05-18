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

@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get()
  getSongs(): SongDto[] {
    return this.songService.getSongs();
  }

  @Get(':id')
  getSongById(
    @Param('id', ParseUUIDPipe) id: string,
  ): SongDto & { artistName: string } {
    return this.songService.getSongById(id);
  }

  /**
   * Notice how this method does NOT manually call `validate(body)` — the
   * global `ValidationPipe` already did it for us, so by the time the
   * handler runs we can trust the shape of `body` 100%.
   */
  @Post()
  createSong(@Body() body: SongCreateDto): SongDto {
    return this.songService.createSong(body);
  }

  @Patch(':id')
  updateSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SongUpdateDto,
  ): SongDto {
    return this.songService.updateSong(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSong(@Param('id', ParseUUIDPipe) id: string): void {
    this.songService.deleteSong(id);
  }
}
