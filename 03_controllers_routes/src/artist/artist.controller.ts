/**
 * REST-style demo controller for `Artist` resources.
 *
 * **Route order:** `@Get('search')` is declared before `@Get(':id')` so `/artist/search` is not
 * interpreted as `id = "search"`. Static paths must usually come before dynamic segments.
 *
 * Data is kept in memory on the class for learning; `04_providers_di` extracts this into `ArtistService`.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

interface Artist {
  id: number;
  name: string;
  genre: string;
}

/** Payload for POST — no `id` yet (server assigns it here). */
type CreateArtist = Omit<Artist, 'id'>;
// type CreateArtist = Pick<Artist, 'name' | 'genre'>;

/** PUT replaces name + genre; `id` comes from the URL. */
type UpdateArtist = Omit<Artist, 'id'>;

/** PATCH allows a subset of fields (`Partial` of the PUT shape). */
type PartiallyUpdateArtist = Partial<UpdateArtist>;

@Controller('artist')
export class ArtistController {
  private artists: Artist[] = [
    {
      id: 1,
      name: 'The Beatles',
      genre: 'Rock',
    },
    {
      id: 2,
      name: 'Beyoncé',
      genre: 'Pop',
    },
    {
      id: 3,
      name: 'Miles Davis',
      genre: 'Jazz',
    },
    {
      id: 4,
      name: 'Eminem',
      genre: 'Hip Hop',
    },
    {
      id: 5,
      name: 'Daft Punk',
      genre: 'Electronic',
    },
  ];

  /** GET /artist — return the full in-memory list. */
  @Get()
  getAllArtists() {
    return this.artists;
  }

  /** GET /artist/search?genre=Rock — `@Query('genre')` reads the query string; empty genre → all artists. */
  @Get('search')
  search(@Query('genre') genre: string): Artist[] {
    console.log('Received genre:', genre);
    if (!genre) {
      return this.artists;
    }
    return this.artists.filter(
      (artist) => artist.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  /**
   * GET /artist/:id — `:id` is always a string; compare with `Number(id)` or validate first.
   * `NotFoundException` becomes HTTP 404 with a JSON error body in Nest’s default exception filter.
   */
  @Get(':id')
  getArtistById(@Param('id') id: string): Artist {
    console.log('Received ID:', id, typeof id); // Debugging log
    const artist = this.artists.find((artist) => artist.id === Number(id));

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  /** POST /artist — JSON body mapped to `CreateArtist`; naive `id` generation for the demo list. */
  @Post()
  createArtist(@Body() body: CreateArtist): Artist {
    const newArtist: Artist = {
      ...body,
      id: this.artists.length + 1,
    };

    this.artists.push(newArtist);

    return newArtist;
  }

  /** PUT /artist/:id — replace the entire resource; 404 if the id does not exist. */
  @Put(':id')
  updateArtist(@Param('id') id: string, @Body() body: UpdateArtist) {
    const existingArtistIndex = this.artists.findIndex(
      (artist) => artist.id === Number(id),
    );

    if (existingArtistIndex === -1) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    this.artists[existingArtistIndex] = {
      ...body,
      id: Number(id),
    };

    return this.artists[existingArtistIndex];
  }

  /** PATCH /artist/:id — merge JSON fields onto the existing artist; `id` in the URL wins. */
  @Patch(':id')
  partiallyUpdateArtist(
    @Param('id') id: string,
    @Body() body: PartiallyUpdateArtist,
  ) {
    const existingArtistIndex = this.artists.findIndex(
      (artist) => artist.id === Number(id),
    );

    if (existingArtistIndex === -1) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    this.artists[existingArtistIndex] = {
      ...this.artists[existingArtistIndex],
      ...body,
      id: Number(id),
    };

    return this.artists[existingArtistIndex];
  }

  /**
   * DELETE /artist/:id — remove if present; respond with **204 No Content** and no JSON body.
   * `@HttpCode` sets the status because Nest would otherwise default to 200 for an empty return.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArtist(@Param('id') id: string): void {
    this.artists = this.artists.filter((artist) => artist.id !== Number(id));
  }
}
