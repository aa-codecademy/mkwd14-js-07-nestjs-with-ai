import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumDto } from './dto/album.dto';
import { AlbumCreateDto } from './dto/album-create.dto';
import { randomUUID } from 'crypto';
import { AlbumUpdateDto } from './dto/album-update.dto';

@Injectable()
export class AlbumService {
  private albums: AlbumDto[] = [];

  create(body: AlbumCreateDto): AlbumDto {
    const newAlbum: AlbumDto = {
      ...body,
      id: randomUUID(),
    };

    this.albums.push(newAlbum);

    return newAlbum;
  }

  findAll(): AlbumDto[] {
    return this.albums;
  }

  findOne(id: string): AlbumDto {
    const album = this.albums.find((album) => album.id === id);
    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }
    return album;
  }

  update(id: string, body: AlbumUpdateDto): AlbumDto {
    this.findOne(id); // Check if the album exists

    this.albums = this.albums.map((album) => {
      if (album.id === id) {
        return { ...album, ...body };
      }
      return album;
    });

    return this.findOne(id); // Return the updated album
  }

  remove(id: string): void {
    this.albums = this.albums.filter((album) => album.id !== id);
  }
}
