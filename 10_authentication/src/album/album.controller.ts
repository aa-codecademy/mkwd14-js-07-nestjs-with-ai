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
import { AlbumUpdateDto } from './dto/album-update.dto';
import { Album } from './album.entity';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

// @UsePipes(new ValidationPipe()) // ← controller-level pipe (kept commented; global pipe wins)
@ApiTags('Album')
@Controller('album')
export class AlbumController {
  constructor(private readonly albumService: AlbumService) {}

  @ApiOperation({ summary: 'Create a new album' })
  @ApiCreatedResponse({
    description: 'Album has been successfully created',
    type: Album,
  })
  @Post()
  create(@Body() body: AlbumCreateDto): Promise<Album> {
    return this.albumService.create(body);
  }

  @ApiOperation({ summary: 'List all albums' })
  @ApiOkResponse({
    description: 'Albums are successfully returned',
    type: Album,
    isArray: true,
  })
  @Get()
  findAll(): Promise<Album[]> {
    return this.albumService.findAll();
  }

  @ApiOperation({ summary: 'Get an album by ID' })
  @ApiOkResponse({ description: 'Album is successfully returned', type: Album })
  @ApiNotFoundResponse({
    description: 'Album with the given ID does not exist',
  })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Album> {
    return this.albumService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an album' })
  @ApiOkResponse({
    description: 'Album has been successfully updated',
    type: Album,
  })
  @ApiNotFoundResponse({
    description: 'Album with the given ID does not exist',
  })
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAlbumDto: AlbumUpdateDto,
  ): Promise<Album> {
    return this.albumService.update(id, updateAlbumDto);
  }

  @ApiOperation({ summary: 'Delete an album' })
  @ApiNoContentResponse({ description: 'Album has been successfully deleted' })
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.albumService.remove(id);
  }
}
