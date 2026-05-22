/**
 * Song service — CRUD persistence for `Song` rows via TypeORM.
 *
 * This file deliberately uses TWO different update strategies so you can
 * compare them side-by-side with `AlbumService.update`:
 *
 *   `AlbumService.update`  →  load + spread merge + `save({...})`
 *   `SongService.updateSong` →  guard + `update(id, partial)` + reload
 *
 * Both reach the same end state; the trade-offs are:
 *
 *   `save()`     – fires lifecycle hooks, returns the hydrated entity,
 *                  but issues an extra SELECT to load the original row.
 *   `update()`   – single round-trip UPDATE, faster, no hooks, returns only
 *                  an `UpdateResult` so you must reload if you need the row.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { SongCreateDto } from './dto/song-create.dto';
import { SongUpdateDto } from './dto/song-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Song } from './song.entity';
import type { Repository } from 'typeorm';
import { Album } from '../album/album.entity';
import { Artist } from '../artist/artist.entity';

@Injectable()
export class SongService {
  constructor(
    @InjectRepository(Song) private readonly songRepository: Repository<Song>,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    private readonly logger: LoggerService,
  ) {}

  /** List all songs (paginate me in production). */
  getSongs(): Promise<Song[]> {
    return this.songRepository.find({
      relations: {
        album: true,
      },
    });
  }

  /**
   * `findOne({ where: { id } })` is the verbose form of `findOneBy({ id })`.
   * Both produce the same SQL — `findOne` is useful when you also want to
   * include `relations`, `select`, `order`, etc., in the same call:
   *
   *   this.songRepository.findOne({
   *     where: { id },
   *     relations: { album: true },   // eager-load related rows
   *     select: { id: true, title: true },
   *   });
   */
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

  /**
   * Stubbed out for now — kept as a hint for the next lesson where you'll
   * model a real ManyToMany relation between Song and Artist using
   * `@JoinTable()` and `@ManyToMany()`.
   */
  getSongsByArtistId(artistId: string): any {
    // return this.songs.filter((song) =>
    //   song.featuringArtistsId.includes(artistId),
    // );
  }

  /** Same create-and-save pattern as `AlbumService.create`. */
  async createSong(body: SongCreateDto): Promise<Song> {
    if (body.albumId) {
      const album = await this.albumRepository.findOneBy({ id: body.albumId });

      if (!album) {
        throw new NotFoundException(
          `Album with ID: ${body.albumId} doesn't exist`,
        );
      }
    }

    const artist = await this.artistRepository.findOneBy({
      id: body.artistId,
    });

    if (!artist) {
      throw new NotFoundException(
        `Artist with ID: ${body.artistId} doesn't exist`,
      );
    }

    const newSong = this.songRepository.create(body);

    const createdSong = await this.songRepository.save(newSong);

    return createdSong;
  }

  /**
   * The "update + reload" variant:
   *
   *   1. `getSongById(id)` → throws 404 if not found (guard clause).
   *   2. `repository.update(id, body)` issues a single `UPDATE` statement.
   *      It does NOT call entity hooks and does NOT return the new row.
   *   3. `findOneBy({ id })` → fetch the fresh state to return to the client.
   *
   * Choose this style when you care about UPDATE efficiency and don't need
   * lifecycle hooks. Choose the `save({...spread})` style when you do.
   */
  async updateSong(id: string, body: SongUpdateDto): Promise<Song | null> {
    if (body.albumId) {
      const album = await this.albumRepository.findOneBy({ id: body.albumId });

      if (!album) {
        throw new NotFoundException(
          `Album with ID: ${body.albumId} doesn't exist`,
        );
      }
    }

    if (!body.artistId) {
      const artist = await this.artistRepository.findOneBy({
        id: body.artistId,
      });

      if (!artist) {
        throw new NotFoundException(
          `Artist with ID: ${body.artistId} doesn't exist`,
        );
      }
    }

    await this.getSongById(id);

    await this.songRepository.update(id, body);

    return this.songRepository.findOneBy({ id });
  }

  /** Soft delete — `deletedAt` set to NOW(), row excluded from future `find()`s. */
  async deleteSong(id: string): Promise<void> {
    await this.songRepository.softDelete(id);
  }
}
