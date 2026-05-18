import { Injectable, NotFoundException } from '@nestjs/common';
import { ArtistService } from '../artist/artist.service';
import { LoggerService } from '../logger/logger.service';
import { SongDto } from './dto/song.dto';
import { SongCreateDto } from './dto/song-create.dto';
import { SongUpdateDto } from './dto/song-update.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class SongService {
  private songs: SongDto[] = [];

  constructor(
    private readonly logger: LoggerService,
    /**
     * One-way dependency: SongService can read artists, but ArtistService does not depend on SongService.
     * This avoids circular provider graphs and removes the need for `forwardRef(...)`.
     */
    private readonly artistService: ArtistService,
  ) {}

  getSongs(): SongDto[] {
    return this.songs;
  }

  getSongById(id: string): SongDto & { artistName: string } {
    const song = this.songs.find((song) => song.id === id);

    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }

    const artist = this.artistService.getArtistById(song.artistId);

    return { ...song, artistName: artist.name };
  }

  getSongsByArtistId(artistId: string): SongDto[] {
    return this.songs.filter((song) => song.artistId === artistId);
  }

  createSong(body: SongCreateDto): SongDto {
    const newSong: SongDto = {
      ...body,
      id: randomUUID(),
    };

    this.songs.push(newSong);

    return newSong;
  }

  updateSong(id: string, body: SongUpdateDto): SongDto {
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

  deleteSong(id: string): void {
    this.songs = this.songs.filter((s) => s.id !== id);
  }
}
