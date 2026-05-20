/**
 * Domain logic for artists: in-memory storage for learning (replace with a database later).
 *
 * `@Inject(ARTIST_ID_GENERATOR)` receives the factory-created ID function from `AppModule`
 * instead of hard-coding `Date.now()` here — easier to mock in tests or swap strategies.
 *
 * Important architecture choice:
 * - This service no longer depends on SongService.
 * - Keeping dependencies one-directional (Song -> Artist) avoids circular references.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import type { ArtistCreateDto } from './dto/artist-create.dto';
import type { ArtistDto } from './dto/artist.dto';
import type { ArtistPartialUpdateDto } from './dto/artist-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Artist } from './artist.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class ArtistService {
  private artists: ArtistDto[] = [];

  constructor(
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    private readonly logger: LoggerService,
  ) {}

  /** Snapshot of every stored artist (no pagination in this demo). */
  getAllArtists(): ArtistDto[] {
    this.logger.info('ArtistService.getAllArtists', 'Retrieving all artists');
    return this.artists;
  }

  /** Case-insensitive genre filter; empty string → behave like “no filter”. */
  search(genre: string): ArtistDto[] {
    this.logger.info(
      'ArtistService.search',
      `Searching artists with genre: ${genre}`,
    );
    if (!genre) {
      this.logger.warn(
        'ArtistService.search',
        'Empty genre provided, returning all artists',
      );
      return this.artists;
    }
    return this.artists.filter(
      (artist) => artist.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  /** Throws Nest `NotFoundException` → HTTP 404 via the default exception layer. */
  getArtistById(id: string): ArtistDto {
    this.logger.info(
      'ArtistService.getArtistById',
      `Retrieving artist with ID: ${id}`,
    );
    const artist = this.artists.find((artist) => artist.id === id);

    if (!artist) {
      this.logger.error(
        'ArtistService.getArtistById',
        `Artist with ID ${id} not found`,
      );
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    this.logger.debug(
      'ArtistService.getArtistById',
      `Found artist: ${artist.name} (Genre: ${artist.genre})`,
    );
    return artist;
  }

  /** Appends a row using `newId()` so ids stay centralized / mock-friendly. */
  async createArtist(body: ArtistCreateDto): Promise<Artist> {
    const newArtist = this.artistRepository.create({
      name: body.name,
      genre: body.genre,
      isActive: body.isActive,
      debutYear: body.debutYear,
    });

    const savedArtist = await this.artistRepository.save(newArtist);

    return savedArtist;
  }

  /** PUT semantics — replace entire entity except the stable primary key from the URL. */
  // updateArtist(id: string, body: ArtistUpdateDto): ArtistDto {
  //   const existingArtistIndex = this.artists.findIndex(
  //     (artist) => artist.id === id,
  //   );

  //   if (existingArtistIndex === -1) {
  //     throw new NotFoundException(`Artist with ID ${id} not found`);
  //   }

  //   this.artists[existingArtistIndex] = {
  //     ...body,
  //     id,
  //   };

  //   return this.artists[existingArtistIndex];
  // }

  /** PATCH semantics — shallow merge over the existing record. */
  partiallyUpdateArtist(id: string, body: ArtistPartialUpdateDto): ArtistDto {
    const existingArtistIndex = this.artists.findIndex(
      (artist) => artist.id === id,
    );

    if (existingArtistIndex === -1) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    this.artists[existingArtistIndex] = {
      ...this.artists[existingArtistIndex],
      ...body,
      id,
    };

    return this.artists[existingArtistIndex];
  }

  /** Idempotent-friendly delete: silently removes matches; HTTP layer sets 204 in the controller. */
  deleteArtist(id: string): void {
    this.artists = this.artists.filter((artist) => artist.id !== id);
  }
}
