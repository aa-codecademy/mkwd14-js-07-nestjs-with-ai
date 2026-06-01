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
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { ArtistCreateDto } from './dto/artist-create.dto';
import { ArtistPartialUpdateDto } from './dto/artist-update.dto';
import { Artist } from './entitites/artist.entity';
import { ArtistSearchQueryDto } from './dto/artist-search-query.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Artist')
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
  @Get()
  getArtists(@Query() query: ArtistSearchQueryDto): Promise<Artist[]> {
    return this.artistsService.getArtists(query);
  }

  @Get(':id')
  getArtistById(@Param('id', ParseUUIDPipe) id: string): Promise<Artist> {
    return this.artistsService.getArtistById(id);
  }

  @Post()
  createArtist(@Body() body: ArtistCreateDto): Promise<Artist> {
    return this.artistsService.createArtist(body);
  }

  /**
   * PUT example (commented out so PATCH is the only working endpoint).
   *
   * Note how PUT would use a "full" DTO (`ArtistUpdateDto`) where required
   * fields are NOT optional — PUT replaces the whole resource.
   */
  // @Put(':id')
  // updateArtist(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() body: ArtistUpdateDto,
  // ): ArtistDto {
  //   return this.artistsService.updateArtist(id, body);
  // }

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
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteArtist(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.artistsService.deleteArtist(id);
  }
}
