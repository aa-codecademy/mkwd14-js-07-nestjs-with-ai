/**
 * Playlist entity — the first true MANY-TO-MANY relation in this project.
 *
 * A playlist can contain many songs, AND a song can appear in many playlists.
 * Postgres can't express that with a single FK column, so TypeORM creates a
 * dedicated JUNCTION (a.k.a. "join" / "pivot" / "link") table with two FK
 * columns — one to `playlist.id`, one to `song.id`.
 *
 * Owning vs inverse — recap for `@ManyToMany`:
 *   - The OWNING side carries the `@JoinTable()` decorator. ONLY ONE side may.
 *     That side controls inserts/deletes in the junction table.
 *   - The INVERSE side just references back with `@ManyToMany(() => Owner, …)`.
 *     It lives on `Song.playlists` (see `src/song/song.entity.ts`).
 *
 * Reference: https://typeorm.io/many-to-many-relations
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Song } from '../../song/song.entity';

@Entity()
export class Playlist {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'd3f9b5aa-2d8f-4ae5-aad6-8d80d6a97b7f' })
  id!: string;

  @Column()
  @ApiProperty({ example: 'Roadtrip' })
  title!: string;

  @Column()
  @ApiProperty({ example: 'Dawn Wilson' })
  author!: string;

  /**
   * `@ManyToMany` + `@JoinTable()` — the OWNING side.
   *
   * `@JoinTable({ name: 'playlist_songs' })` instructs TypeORM to:
   *   1. CREATE TABLE "playlist_songs" (
   *        "playlistId" uuid REFERENCES playlist(id),
   *        "songId"     uuid REFERENCES song(id),
   *        PRIMARY KEY ("playlistId", "songId")
   *      );
   *   2. Auto-INSERT/DELETE rows in that table whenever you save a
   *      `Playlist` with a different `songs` array.
   *
   * Without the `name` option TypeORM would auto-generate a (uglier) table
   * name like `playlist_songs_song`. Giving it an explicit, snake_case name
   * is a small kindness for anyone reading raw SQL later.
   *
   * Optional `@JoinTable` settings you'll meet in real apps:
   *   - `joinColumn:        { name: 'playlist_id', referencedColumnName: 'id' }`
   *   - `inverseJoinColumn: { name: 'song_id',     referencedColumnName: 'id' }`
   *   These let you mirror the snake_case naming style of the rest of your
   *   schema if you use a custom `namingStrategy`.
   *
   * Saving songs onto a playlist:
   *   - `playlistRepository.save({ ...p, songs: [s1, s2] })` REPLACES the
   *     entire set. To add one without removing the rest, load `songs` first,
   *     spread, then save. See `PlaylistService.addSongs` for the pattern.
   */
  @ManyToMany(() => Song, (song) => song.playlists)
  @JoinTable({
    name: 'playlist_songs',
  })
  @ApiProperty({
    type: () => Song,
    isArray: true,
    description: 'Songs included in the playlist',
  })
  songs!: Song[];

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  @ApiProperty({ type: Date })
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({ type: Date, nullable: true })
  updatedAt!: Date | null;

  /** Enables `repository.softDelete(...)` for this entity. */
  @DeleteDateColumn()
  @ApiProperty({ type: Date, nullable: true })
  deletedAt!: Date | null;
}
