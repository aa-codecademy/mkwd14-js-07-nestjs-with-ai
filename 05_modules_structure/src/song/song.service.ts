import { Injectable, NotFoundException } from '@nestjs/common';
import type { Song } from './song.interface';

@Injectable()
export class SongService {
  private songs: Song[] = [
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      durationInSeconds: 354,
    },
    {
      id: 2,
      title: 'Imagine',
      artist: 'John Lennon',
      durationInSeconds: 183,
    },
    {
      id: 3,
      title: 'Hotel California',
      artist: 'Eagles',
      durationInSeconds: 391,
    },
    {
      id: 4,
      title: 'Stairway to Heaven',
      artist: 'Led Zeppelin',
      durationInSeconds: 482,
    },
  ];

  getSongs(): Song[] {
    return this.songs;
  }

  getSongById(id: number): Song {
    const song = this.songs.find((song) => song.id === id);

    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }

    return song;
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
