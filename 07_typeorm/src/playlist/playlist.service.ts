import { Injectable, NotFoundException } from '@nestjs/common';
import { PlaylistCreateDto } from './dto/playlist-create.dto';
import { PlaylistUpdateDto } from './dto/playlist-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class PlaylistService {
  constructor(
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
  ) {}

  async create(body: PlaylistCreateDto): Promise<Playlist> {
    const newPlaylist = this.playlistRepository.create(body);

    const createdPlaylist = await this.playlistRepository.save(newPlaylist);

    return createdPlaylist;
  }

  findAll(): Promise<Playlist[]> {
    return this.playlistRepository.find({
      relations: {
        songs: true,
      },
    });
  }

  async findOne(id: string): Promise<Playlist> {
    const playlist = await this.playlistRepository.findOneBy({ id });

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID: ${id} is not found.`);
    }

    return playlist;
  }

  async update(id: string, body: PlaylistUpdateDto): Promise<Playlist> {
    const playlist = await this.findOne(id);

    const updatedPlaylist = await this.playlistRepository.save({
      ...playlist,
      ...body,
    });

    return updatedPlaylist;
  }

  async remove(id: string): Promise<void> {
    await this.playlistRepository.softDelete(id);
  }
}
