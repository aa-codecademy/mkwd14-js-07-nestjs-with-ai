/**
 * Artist HTTP API.
 *
 * Focus for this lesson — see how each handler argument is built:
 *
 *   - `@Body() body: ArtistCreateDto`   → runs through the GLOBAL
 *     `ValidationPipe` (registered in `main.ts`). The raw JSON is converted
 *     into an `ArtistCreateDto` instance and every decorator on the class
 *     is checked. If anything fails, Nest replies with HTTP 400 and this
 *     method is never called.
 *
 *   - `@Param('id') id: string`         → bound from the URL. To get UUID
 *     format validation for free you can swap this for
 *     `@Param('id', ParseUUIDPipe)` — try it as an exercise.
 *
 *   - `@Query('genre') genre: string`   → bound from the query string.
 *     Same trick applies: pipes like `ParseIntPipe`, `DefaultValuePipe`,
 *     etc. can be chained here.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { ArtistCreateDto } from './dto/artist-create.dto';
import { ArtistPartialUpdateDto } from './dto/artist-update.dto';
import { Artist } from './entities/artist.entity';
import { ArtistSearchQueryDto } from './dto/artist-search-query.dto';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@ApiTags('Artist')
@ApiBearerAuth('access-token')
@Controller('artist')
export class ArtistController {
  constructor(private readonly artistsService: ArtistService) {}

  @ApiOperation({
    summary: 'List all artists',
    description:
      'This endpoint provides ability to search and filter artists by using query parameters',
  })
  @ApiOkResponse({
    description: 'Artists are successfully returned',
    type: Artist,
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  getArtists(@Query() query: ArtistSearchQueryDto): Promise<Artist[]> {
    return this.artistsService.getArtists(query);
  }

  // @Param() params: GetArtistByIdDto
  @ApiOperation({
    summary: 'Get an artist by ID',
  })
  @ApiOkResponse({
    description: 'Artist is successfully returned',
    type: Artist,
  })
  @ApiNotFoundResponse({
    description: `Artist with ID doesn't exist`,
  })
  @Get(':id')
  getArtistById(@Param('id', ParseUUIDPipe) id: string): Promise<Artist> {
    return this.artistsService.getArtistById(id);
  }

  @ApiOperation({
    summary: 'Create a new artist',
  })
  @ApiCreatedResponse({
    description: 'Artist has been successfully created',
    type: Artist,
  })
  @Post()
  createArtist(@Body() body: ArtistCreateDto): Promise<Artist> {
    return this.artistsService.createArtist(body);
  }

  @ApiOperation({
    summary: 'Update an artist',
  })
  @ApiOkResponse({
    description: 'Artist has been successfully updated',
    type: Artist,
  })
  @ApiNotFoundResponse({
    description: `Artist doesn't exist`,
  })
  @Patch(':id')
  partiallyUpdateArtist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ArtistPartialUpdateDto,
  ): Promise<Artist> {
    return this.artistsService.partiallyUpdateArtist(id, body);
  }

  /**
   * `@HttpCode(204)` overrides the default 201 for DELETE so we conform to
   * REST conventions: "no content" on success.
   */
  @ApiOperation({
    summary: 'Delete an artist',
  })
  @ApiNoContentResponse({
    description: 'Artist has been successfully deleted',
  })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArtist(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.artistsService.deleteArtist(id);
  }
}
