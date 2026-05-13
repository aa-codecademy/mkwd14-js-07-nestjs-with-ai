import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ArtistService } from '../artist/artist.service';
import { LoggerService } from '../logger/logger.service';
import type { Song } from './song.interface';

@Injectable()
export class SongService {
  private songs: Song[] = [
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      artistId: 1,
      durationInSeconds: 354,
    },
    {
      id: 2,
      title: 'Imagine',
      artistId: 2,
      durationInSeconds: 183,
    },
    {
      id: 3,
      title: 'Hotel California',
      artistId: 3,
      durationInSeconds: 391,
    },
    {
      id: 4,
      title: 'Stairway to Heaven',
      artistId: 4,
      durationInSeconds: 482,
    },
  ];

  constructor(
    private readonly logger: LoggerService,
    /**
     * One-way dependency: SongService can read artists, but ArtistService does not depend on SongService.
     * This avoids circular provider graphs and removes the need for `forwardRef(...)`.
     */
    private readonly artistService: ArtistService,
  ) {}

  getSongs(): Song[] {
    return this.songs;
  }

  getSongById(id: number): Song & { artistName: string } {
    const song = this.songs.find((song) => song.id === id);

    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }

    const artist = this.artistService.getArtistById(song.artistId);

    return { ...song, artistName: artist.name };
  }

  getSongsByArtistId(artistId: number): Song[] {
    return this.songs.filter((song) => song.artistId === artistId);
  }

  createSong(body: Omit<Song, 'id'>): Song {
    const newSong: Song = {
      ...body,
      id: this.songs.length + 1,
    };

    this.songs.push(newSong);

    return newSong;
  }

  updateSong(id: number, body: Partial<Omit<Song, 'id'>>): Song {
    this.getSongById(id);

    this.songs = this.songs.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          ...body,
          id,
        };
      }
      return s;
    });

    return this.getSongById(id);
  }

  deleteSong(id: number): void {
    this.songs = this.songs.filter((s) => s.id !== id);
  }
}
