import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import type { Album } from './album.interface';

@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  create(@Body() body: Omit<Album, 'id'>): Album {
    return this.albumService.create(body);
  }

  @Get()
  findAll(): Album[] {
    return this.albumService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Album {
    return this.albumService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlbumDto: Partial<Omit<Album, 'id'>>,
  ): Album {
    return this.albumService.update(+id, updateAlbumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    this.albumService.remove(+id);
  }
}
