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
import { SongCreateDto } from './dto/song-create.dto';
import { SongDto } from './dto/song.dto';
import { SongUpdateDto } from './dto/song-update.dto';

// localhost:3000/song
@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @Get()
  getSongs(): SongDto[] {
    return this.songService.getSongs();
  }

  @Get(':id')
  getSongById(@Param('id') id: string): SongDto & { artistName: string } {
    return this.songService.getSongById(id);
  }

  @Post()
  createSong(@Body() body: SongCreateDto): SongDto {
    return this.songService.createSong(body);
  }

  @Patch(':id')
  updateSong(@Param('id') id: string, @Body() body: SongUpdateDto): SongDto {
    return this.songService.updateSong(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteSong(@Param('id') id: string): void {
    this.songService.deleteSong(id);
  }
}
