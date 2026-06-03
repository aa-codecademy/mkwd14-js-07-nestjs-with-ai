/**
 * Song entity — maps to the `song` table.
 *
 * Demonstrates THREE relations:
 *   - `artist`    → required `@ManyToOne` ("every song has a performer")
 *   - `album`     → optional `@ManyToOne` ("singles" exist before an album)
 *   - `playlists` → INVERSE `@ManyToMany` to `Playlist` (a song can appear
 *                   in many playlists; junction table is `playlist_songs`)
 *
 * It also shows two more `@Column` patterns:
 *   - `default: false` lets the DB assign a value when the client doesn't.
 *   - `nullable: true` on `albumId` so a song can exist without an album yet.
 *
 * TODO note in the original code: a Postgres `CHECK (durationSeconds > 0)`
 * constraint would belong here as `@Check("...")` from typeorm.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Album } from '../album/album.entity';
import { Artist } from '../artist/entities/artist.entity';
import { Playlist } from '../playlist/entities/playlist.entity';

@Entity()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ example: 'd3f9b5aa-2d8f-4ae5-aad6-8d80d6a97b7f' })
  id!: string;

  @Column({ length: 200 })
  @ApiProperty({ example: 'Bohemian Rhapsody' })
  title!: string;

  // add positive number check constraint
  /**
   * Plain `int` column. We model durations as seconds (integer) instead of a
   * Postgres `interval` because integers are simpler to serialize over JSON
   * and trivially comparable / sortable in SQL.
   */
  @Column({
    type: 'int',
  })
  @ApiProperty({ example: 245, type: 'integer' })
  durationSeconds!: number;

  /**
   * `default: false` writes the default at the DATABASE level (DDL
   * `DEFAULT false`). That means even raw `INSERT` statements get the
   * default — the value is not just a JS fallback.
   */
  @Column({
    default: false,
  })
  @ApiProperty({ example: false })
  isExplicit!: boolean;

  /**
   * Required FK to `artist.id`. Every song is performed by exactly one artist,
   * so this column is NOT nullable. Pairs with the `artist` relation below.
   */
  @Column('uuid')
  @ApiProperty({
    description: 'UUID of the artist who performs the song',
    format: 'uuid',
    example: 'd3f9b5aa-2d8f-4ae5-aad6-8d80d6a97b7f',
  })
  artistId!: string;

  /**
   * `@ManyToOne(() => Artist, artist => artist.songs)` — the OWNING side of
   * Artist→Song. The matching INVERSE side is `Artist.songs`
   * (`@OneToMany(() => Song, song => song.artist)`).
   *
   * Owning vs inverse — a quick refresher:
   *   - The OWNING side is the side that has the FK column. For `@ManyToOne`
   *     this is always the "many" side. That's the one TypeORM needs to UPDATE
   *     to change the relationship.
   *   - The INVERSE side has no column; it's purely for navigation in code,
   *     e.g. `artist.songs`.
   */
  @ManyToOne(() => Artist, (artist) => artist.songs)
  @ApiProperty({ type: () => Artist })
  artist!: Artist;

  /**
   * Nullable UUID — a song may exist without belonging to an album yet
   * (think singles or pre-release tracks). Compare with `Album.artistId`,
   * which is non-null because every album must have a creator.
   */
  @Column({ type: 'uuid', nullable: true })
  @ApiProperty({
    description: 'UUID of the album containing the song',
    format: 'uuid',
    nullable: true,
  })
  albumId!: string;

  /**
   * Optional `@ManyToOne` — a song may belong to one album, or none.
   * Inverse side: `Album.songs` (`@OneToMany`). With this relation in place,
   * `songRepository.findOne({ where: { id }, relations: { album: true } })`
   * eagerly loads the parent album.
   */
  @ManyToOne(() => Album, (album) => album.songs)
  @ApiProperty({ type: () => Album, nullable: true })
  album!: Album;

  /**
   * `@ManyToMany(() => Playlist, playlist => playlist.songs)` — INVERSE side.
   *
   * No `@JoinTable()` here on purpose: only ONE side of a many-to-many gets
   * to declare the junction table. The owning side is `Playlist.songs`
   * (see `src/playlist/entities/playlist.entity.ts`), which declared
   * `@JoinTable({ name: 'playlist_songs' })`.
   *
   * What this gives us:
   *   - `songRepository.findOne({ where: { id }, relations: { playlists: true } })`
   *     returns the song with every playlist it appears in.
   *
   * Why this side is "inverse":
   *   - The owning side controls the junction table writes. From the song's
   *     point of view, playlist membership is a read-only graph view —
   *     adding/removing songs from a playlist goes through `PlaylistService`.
   */
  @ManyToMany(() => Playlist, (playlist) => playlist.songs)
  @ApiProperty({
    type: () => Playlist,
    isArray: true,
    description: 'Playlists that include this song',
  })
  playlists!: Playlist[];

  @CreateDateColumn()
  @ApiProperty({ type: Date })
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({ type: Date, nullable: true })
  updatedAt!: Date | null;

  @DeleteDateColumn()
  @ApiProperty({ type: Date, nullable: true })
  deletedAt!: Date | null;
}
