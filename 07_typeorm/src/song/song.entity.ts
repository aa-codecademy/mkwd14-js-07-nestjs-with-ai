/**
 * Song entity — maps to the `song` table.
 *
 * Demonstrates two `@ManyToOne` relations side by side:
 *   - `artist`  → required ("every song has a performer")
 *   - `album`   → optional ("singles" exist before being on an album)
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
import { Album } from '../album/album.entity';
import { Artist } from '../artist/entitites/artist.entity';
import { Playlist } from '../playlist/entities/playlist.entity';

@Entity()
export class Song {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 200 })
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
  durationSeconds!: number;

  /**
   * `default: false` writes the default at the DATABASE level (DDL
   * `DEFAULT false`). That means even raw `INSERT` statements get the
   * default — the value is not just a JS fallback.
   */
  @Column({
    default: false,
  })
  isExplicit!: boolean;

  /**
   * Required FK to `artist.id`. Every song is performed by exactly one artist,
   * so this column is NOT nullable. Pairs with the `artist` relation below.
   */
  @Column('uuid')
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
  artist!: Artist;

  /**
   * Nullable UUID — a song may exist without belonging to an album yet
   * (think singles or pre-release tracks). Compare with `Album.artistId`,
   * which is non-null because every album must have a creator.
   */
  @Column({ type: 'uuid', nullable: true })
  albumId!: string;

  /**
   * Optional `@ManyToOne` — a song may belong to one album, or none.
   * Inverse side: `Album.songs` (`@OneToMany`). With this relation in place,
   * `songRepository.findOne({ where: { id }, relations: { album: true } })`
   * eagerly loads the parent album.
   */
  @ManyToOne(() => Album, (album) => album.songs)
  album!: Album;

  @ManyToMany(() => Playlist, (playlist) => playlist.songs)
  playlists!: Playlist[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
