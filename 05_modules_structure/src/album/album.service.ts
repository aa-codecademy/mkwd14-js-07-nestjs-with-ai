import { Injectable, NotFoundException } from '@nestjs/common';
import type { Album } from './album.interface';

@Injectable()
export class AlbumService {
  private albums: Album[] = [
    { id: 1, title: 'Thriller', artist: 'Michael Jackson', year: 1982 },
    { id: 2, title: 'Back in Black', artist: 'AC/DC', year: 1980 },
    {
      id: 3,
      title: 'The Dark Side of the Moon',
      artist: 'Pink Floyd',
      year: 1973,
    },
  ];

  create(body: Omit<Album, 'id'>): Album {
    const newAlbum: Album = {
      ...body,
      id: this.albums.length + 1,
    };

    this.albums.push(newAlbum);

    return newAlbum;
  }

  findAll(): Album[] {
    return this.albums;
  }

  findOne(id: number): Album {
    const album = this.albums.find((album) => album.id === id);
    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }
    return album;
  }

  update(id: number, body: Partial<Omit<Album, 'id'>>) {
    this.findOne(id); // Check if the album exists

    this.albums = this.albums.map((album) => {
      if (album.id === id) {
        return { ...album, ...body };
      }
      return album;
    });

    return this.findOne(id); // Return the updated album
  }

  remove(id: number): void {
    this.albums = this.albums.filter((album) => album.id !== id);
  }
}
