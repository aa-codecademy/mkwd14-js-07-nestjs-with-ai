import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumCreateDto } from './dto/album-create.dto';
import { AlbumDto } from './dto/album.dto';
import { AlbumUpdateDto } from './dto/album-update.dto';

// @UsePipes(new ValidationPipe()) // Apply validation to all routes in this controller
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @Post()
  create(@Body() body: AlbumCreateDto): AlbumDto {
    return this.albumService.create(body);
  }

  @Get()
  findAll(): AlbumDto[] {
    return this.albumService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): AlbumDto {
    return this.albumService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAlbumDto: AlbumUpdateDto,
  ): AlbumDto {
    return this.albumService.update(id, updateAlbumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): void {
    this.albumService.remove(id);
  }
}
