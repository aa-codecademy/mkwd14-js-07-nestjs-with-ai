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
import { SongUpdateDto } from './dto/song-update.dto';
import { Song } from './song.entity';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Song')
@ApiBearerAuth('access-token')
@Controller('song')
export class SongController {
  constructor(private readonly songService: SongService) {}

  @ApiOperation({ summary: 'List all songs' })
  @ApiOkResponse({
    description: 'Songs are successfully returned',
    type: Song,
    isArray: true,
  })
  @Get()
  getSongs(): Promise<Song[]> {
    return this.songService.getSongs();
  }

  @ApiOperation({ summary: 'Get a song by ID' })
  @ApiOkResponse({ description: 'Song is successfully returned', type: Song })
  @Get(':id')
  getSongById(@Param('id', ParseUUIDPipe) id: string): Promise<Song> {
    return this.songService.getSongById(id);
  }

  @ApiOperation({ summary: 'Create a new song' })
  @ApiCreatedResponse({
    description: 'Song has been successfully created',
    type: Song,
  })
  @Post()
  createSong(@Body() body: SongCreateDto): Promise<Song> {
    return this.songService.createSong(body);
  }

  @ApiOperation({ summary: 'Update a song' })
  @ApiOkResponse({
    description: 'Song has been successfully updated',
    type: Song,
  })
  @Patch(':id')
  updateSong(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SongUpdateDto,
  ): Promise<Song | null> {
    return this.songService.updateSong(id, body);
  }

  @ApiOperation({ summary: 'Delete a song' })
  @ApiNoContentResponse({ description: 'Song has been successfully deleted' })
  @Delete(':id')
  @HttpCode(204)
  async deleteSong(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.songService.deleteSong(id);
  }
}
