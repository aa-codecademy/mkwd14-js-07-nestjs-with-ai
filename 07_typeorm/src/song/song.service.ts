import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { SongCreateDto } from './dto/song-create.dto';
import { SongUpdateDto } from './dto/song-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './song.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song) private readonly songRepository: Repository<Song>,
    private readonly logger: LoggerService,
  ) {}

  getSongs(): Promise<Song[]> {
    return this.songRepository.find();
  }

  async getSongById(id: string): Promise<Song> {
    this.logger.debug('getSongById:', id);
    const song = await this.songRepository.findOne({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException(`Song with id ${id} not found`);
    }

    return song;
  }

  getSongsByArtistId(artistId: string): any {
    // return this.songs.filter((song) =>
    //   song.featuringArtistsId.includes(artistId),
    // );
  }

  async createSong(body: SongCreateDto): Promise<Song> {
    const newSong = this.songRepository.create(body);

    const createdSong = await this.songRepository.save(newSong);

    return createdSong;
  }

  async updateSong(id: string, body: SongUpdateDto): Promise<Song | null> {
    await this.getSongById(id);

    await this.songRepository.update(id, body);

    return this.songRepository.findOneBy({ id });
  }

  async deleteSong(id: string): Promise<void> {
    await this.songRepository.softDelete(id);
  }
}
