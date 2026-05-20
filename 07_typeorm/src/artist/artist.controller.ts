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
  Put,
  Query,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import { ArtistCreateDto } from './dto/artist-create.dto';
import { ArtistDto } from './dto/artist.dto';
import {
  ArtistPartialUpdateDto,
  ArtistUpdateDto,
} from './dto/artist-update.dto';
import type { Artist } from './artist.entity';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistsService: ArtistService) {}

  @Get()
  getAllArtists(): ArtistDto[] {
    return this.artistsService.getAllArtists();
  }

  /**
   * `@Query('genre')` reads `?genre=rock` from the URL.
   *
   * No DTO is used here because there is only a single primitive query
   * parameter. For multi-field query strings you would build a
   * `class QueryDto` with `@IsOptional`, `@IsInt`, etc. and bind it with
   * `@Query() query: QueryDto`.
   */
  @Get('search')
  search(@Query('genre') genre: string): ArtistDto[] {
    return this.artistsService.search(genre);
  }

  /**
   * Compare the two forms:
   *
   *   @Param('id') id: string                  ← accepts ANY string
   *   @Param('id', ParseUUIDPipe) id: string   ← 400 if not a UUID
   *
   * `ParseUUIDPipe` is one of Nest's built-in pipes that double as parsers
   * and validators. Using it here means we never even reach the service if
   * the id is malformed.
   */
  @Get(':id')
  getArtistById(@Param('id', ParseUUIDPipe) id: string): ArtistDto {
    return this.artistsService.getArtistById(id);
  }

  /**
   * Creates an artist.
   *
   * `body` is automatically:
   *   1. transformed into an `ArtistCreateDto` instance (because
   *      `ValidationPipe({ transform: true })` is global), and
   *   2. validated against every decorator on the DTO (`@IsString`,
   *      `@Length`, `@ValidateNested`, …).
   *
   * If `forbidNonWhitelisted: true` (set in `main.ts`) is enabled, any
   * extra field the client sends is rejected with HTTP 400.
   */
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

  /**
   * PATCH = partial update. The DTO used here is built from
   * `PartialType(ArtistCreateDto)` — every field optional, but each field
   * that IS sent is still validated.
   */
  @Patch(':id')
  partiallyUpdateArtist(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ArtistPartialUpdateDto,
  ): ArtistDto {
    return this.artistsService.partiallyUpdateArtist(id, body);
  }

  /**
   * `@HttpCode(204)` overrides the default 201 for DELETE so we conform to
   * REST conventions: "no content" on success.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArtist(@Param('id', ParseUUIDPipe) id: string): void {
    this.artistsService.deleteArtist(id);
  }
}
