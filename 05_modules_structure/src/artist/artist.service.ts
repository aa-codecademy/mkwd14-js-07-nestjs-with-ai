/**
 * Domain logic for artists: in-memory storage for learning (replace with a database later).
 *
 * `@Inject(ARTIST_ID_GENERATOR)` receives the factory-created ID function from `AppModule`
 * instead of hard-coding `Date.now()` here — easier to mock in tests or swap strategies.
 */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  Artist,
  CreateArtist,
  PartiallyUpdateArtist,
  UpdateArtist,
} from './artist.interface';
import {
  ARTIST_ID_GENERATOR,
  type ArtistIdGenerator,
} from '../common/providers/id-generator';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ArtistService {
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

  constructor(
    /** Callable injected via `useFactory` — returns the next numeric id when creating rows. */
    @Inject(ARTIST_ID_GENERATOR) private readonly newId: ArtistIdGenerator,
    private readonly logger: LoggerService,
  ) {}

  /** Snapshot of every stored artist (no pagination in this demo). */
  getAllArtists(): Artist[] {
    this.logger.info('ArtistService.getAllArtists', 'Retrieving all artists');
    return this.artists;
  }

  /** Case-insensitive genre filter; empty string → behave like “no filter”. */
  search(genre: string): Artist[] {
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
  getArtistById(id: string): Artist {
    this.logger.info(
      'ArtistService.getArtistById',
      `Retrieving artist with ID: ${id}`,
    );
    const artist = this.artists.find((artist) => artist.id === Number(id));

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
  createArtist(body: CreateArtist): Artist {
    const newArtist: Artist = {
      ...body,
      id: this.newId(),
    };

    this.artists.push(newArtist);

    return newArtist;
  }

  /** PUT semantics — replace entire entity except the stable primary key from the URL. */
  updateArtist(id: string, body: UpdateArtist): Artist {
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

  /** PATCH semantics — shallow merge over the existing record. */
  partiallyUpdateArtist(id: string, body: PartiallyUpdateArtist): Artist {
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

  /** Idempotent-friendly delete: silently removes matches; HTTP layer sets 204 in the controller. */
  deleteArtist(id: string): void {
    this.artists = this.artists.filter((artist) => artist.id !== Number(id));
  }
}
