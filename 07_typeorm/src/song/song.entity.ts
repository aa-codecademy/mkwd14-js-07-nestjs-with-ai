/**
 * Song entity — maps to the `song` table.
 *
 * Shows two more `@Column` patterns:
 *   - `default: false` lets the DB assign a value when the client doesn't.
 *   - The commented `@Column('uuid')` line shows the shorthand for a non-null
 *     UUID column. We use the verbose object form below because we want
 *     `nullable: true` (a song without an album yet — a "single").
 *
 * TODO note in the original code: a Postgres `CHECK (durationSeconds > 0)`
 * constraint would belong here as `@Check("...")` from typeorm.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Album } from '../album/album.entity';
import { Artist } from '../artist/artist.entity';

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

  @Column('uuid')
  artistId!: string;

  @ManyToOne(() => Artist, (artist) => artist.songs)
  artist!: Artist;

  // @Column('uuid')
  /**
   * Nullable UUID — a song may exist without belonging to an album yet
   * (think singles or pre-release tracks). Compare with `album.artistId`,
   * which is non-null because every album must have a creator.
   */
  @Column({ type: 'uuid', nullable: true })
  albumId!: string;

  @ManyToOne(() => Album, (album) => album.songs)
  album!: Album;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
