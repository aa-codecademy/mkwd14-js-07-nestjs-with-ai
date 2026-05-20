/**
 * Album HTTP API.
 *
 * Two extra teaching points compared to the artist/song controllers:
 *
 *   1. The controller-level `@UsePipes(new ValidationPipe())` line is
 *      intentionally LEFT COMMENTED OUT. It demonstrates an alternative
 *      "scope" for the validation pipe (per-controller instead of global).
 *      Because we already register a GLOBAL one in `main.ts`, adding it
 *      here would be redundant. Try uncommenting it after removing the
 *      global one to compare behaviors.
 *
 *   2. The album DTOs (`AlbumCreateDto`) demonstrate the most advanced
 *      validation in the project — an ARRAY of NESTED OBJECTS plus a
 *      string-to-Date transformation. See `dto/album-create.dto.ts`.
 */
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumCreateDto } from './dto/album-create.dto';
import { AlbumDto } from './dto/album.dto';
import { AlbumUpdateDto } from './dto/album-update.dto';

// @UsePipes(new ValidationPipe()) // ← controller-level pipe (kept commented; global pipe wins)
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
  findOne(@Param('id', ParseUUIDPipe) id: string): AlbumDto {
    return this.albumService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlbumDto: AlbumUpdateDto,
  ): AlbumDto {
    return this.albumService.update(id, updateAlbumDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.albumService.remove(id);
  }
}
