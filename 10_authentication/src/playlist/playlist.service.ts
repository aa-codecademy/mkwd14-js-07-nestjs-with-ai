/**
 * Playlist service — CRUD for `Playlist` plus the many-to-many wiring with
 * `Song` (junction table `playlist_songs`).
 *
 * The interesting part of this file is `addSongs(...)`: it shows the typical
 * "load entities then re-save the parent" pattern that TypeORM uses to keep a
 * junction table in sync.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PlaylistCreateDto } from './dto/playlist-create.dto';
import { PlaylistUpdateDto } from './dto/playlist-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { In, type Repository } from 'typeorm';
import { Song } from '../song/song.entity';
import type { AuthUser } from '../auth/types/auth-user';

@Injectable()
export class PlaylistService {
  constructor(
    /** Owned repository — this service is the single writer for `playlist`. */
    @InjectRepository(Playlist)
    private readonly playlistRepository: Repository<Playlist>,
    /**
     * Read-only `Repository<Song>` used to LOAD songs by id when populating
     * the many-to-many junction table. We never write to `song` from here —
     * that's `SongService`'s job.
     */
    @InjectRepository(Song)
    private readonly songRepository: Repository<Song>,
  ) {}

  /** Standard create-and-save. The playlist starts with NO songs (empty `songs`). */
  async create(body: PlaylistCreateDto, user: AuthUser): Promise<Playlist> {
    const newPlaylist = this.playlistRepository.create({
      ...body,
      ownerId: user.id,
    });

    const createdPlaylist = await this.playlistRepository.save(newPlaylist);

    return createdPlaylist;
  }

  /**
   * `relations: { songs: true }` adds the LEFT JOIN through the
   * `playlist_songs` junction table so the response includes the song list
   * for each playlist. Without it, `playlist.songs` would be `undefined`.
   */
  findAll(): Promise<Playlist[]> {
    return this.playlistRepository.find({
      relations: {
        songs: true,
        owner: true,
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

  /** Patch the simple scalar fields (title/author) — no relation changes here. */
  async update(id: string, body: PlaylistUpdateDto): Promise<Playlist> {
    const playlist = await this.findOne(id);

    const updatedPlaylist = await this.playlistRepository.save({
      ...playlist,
      ...body,
    });

    return updatedPlaylist;
  }

  /**
   * Replace the song list of a playlist with the given `songIds`.
   *
   * IMPORTANT: this REPLACES the songs (set-replace semantics), it does NOT
   * append to them. With `@ManyToMany` + `save({ songs: [...] })` TypeORM:
   *
   *   1. Computes the diff between the new array and the rows currently in
   *      the `playlist_songs` junction table.
   *   2. Issues DELETEs for songs that disappeared.
   *   3. Issues INSERTs for songs that are new.
   *
   * That's exactly what makes this method suitable for a PUT endpoint
   * (see `playlist.controller.ts`).
   *
   * Implementation notes:
   *   - We use the `In([...])` operator to load all songs in a SINGLE query
   *     instead of N round-trips (one per song id). Sample SQL:
   *         SELECT * FROM song WHERE id IN ($1, $2, $3);
   *   - If a song id from the request doesn't exist, it's silently dropped
   *     by `In(...)`. To validate strictly you'd compare `songs.length` with
   *     `songIds.length` and throw 404 on mismatch (good exercise).
   *
   * Alternative APIs you'll see in the wild for managing a M:N collection:
   *   - `playlistRepository.createQueryBuilder().relation(Playlist, 'songs')`
   *     `.of(playlistId).add(songId)` / `.remove(songId)` / `.addAndRemove(...)`
   *     → fine-grained, doesn't require loading both sides.
   */
  async addSongs(id: string, songIds: string[]): Promise<Playlist> {
    const playlist = await this.findOne(id);

    const songs = await this.songRepository.find({
      where: {
        id: In(songIds),
      },
    });

    const updatedPlaylist = await this.playlistRepository.save({
      ...playlist,
      songs,
    });

    return updatedPlaylist;
  }

  /**
   * Soft delete the playlist. Soft-delete does NOT cascade through the
   * junction table — rows in `playlist_songs` are left alone, so if you
   * `restore(id)` later the playlist comes back with its songs intact.
   */
  async remove(id: string): Promise<void> {
    await this.playlistRepository.softDelete(id);
  }
}
