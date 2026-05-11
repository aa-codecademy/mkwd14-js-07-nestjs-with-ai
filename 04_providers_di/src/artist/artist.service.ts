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
    @Inject(ARTIST_ID_GENERATOR) private readonly newId: ArtistIdGenerator,
  ) {}

  getAllArtists(): Artist[] {
    return this.artists;
  }

  search(genre: string): Artist[] {
    if (!genre) {
      return this.artists;
    }
    return this.artists.filter(
      (artist) => artist.genre.toLowerCase() === genre.toLowerCase(),
    );
  }

  getArtistById(id: string): Artist {
    const artist = this.artists.find((artist) => artist.id === Number(id));

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  createArtist(body: CreateArtist): Artist {
    const newArtist: Artist = {
      ...body,
      id: this.newId(),
    };

    this.artists.push(newArtist);

    return newArtist;
  }

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

  deleteArtist(id: string): void {
    this.artists = this.artists.filter((artist) => artist.id !== Number(id));
  }
}
