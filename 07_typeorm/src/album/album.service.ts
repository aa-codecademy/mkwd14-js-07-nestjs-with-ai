import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumCreateDto } from './dto/album-create.dto';
import { AlbumUpdateDto } from './dto/album-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Album } from './album.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}

  async create(body: AlbumCreateDto): Promise<Album> {
    const newAlbum = this.albumRepository.create(body);

    const createdAlbum = await this.albumRepository.save(newAlbum);

    return createdAlbum;
  }

  findAll(): Promise<Album[]> {
    return this.albumRepository.find();
  }

  async findOne(id: string): Promise<Album> {
    const album = await this.albumRepository.findOneBy({ id });

    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }

    return album;
  }

  async update(id: string, body: AlbumUpdateDto): Promise<Album> {
    const album = await this.findOne(id);

    const updatedAlbum = await this.albumRepository.save({
      ...album,
      ...body,
    });

    return updatedAlbum;
  }

  async remove(id: string): Promise<void> {
    await this.albumRepository.softDelete(id);
  }
}
