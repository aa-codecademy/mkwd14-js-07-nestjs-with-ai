import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { SongService } from './song.service';
import type { Song } from './song.interface';

// localhost:3000/song
@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get()
  getSongs(): Song[] {
    return this.songService.getSongs();
  }

  @Get(':id')
  getSongById(@Param('id') id: string): Song & { artistName: string } {
    return this.songService.getSongById(Number(id));
  }

  @Post()
  createSong(@Body() body: Omit<Song, 'id'>): Song {
    return this.songService.createSong(body);
  }

  @Patch(':id')
  updateSong(
    @Param('id') id: string,
    @Body() body: Partial<Omit<Song, 'id'>>,
  ): Song {
    return this.songService.updateSong(Number(id), body);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSong(@Param('id') id: string): void {
    this.songService.deleteSong(Number(id));
  }
}
