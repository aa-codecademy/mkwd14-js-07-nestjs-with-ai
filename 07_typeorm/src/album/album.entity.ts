/**
 * Album entity.
 *
 * An "entity" in TypeORM is a TypeScript class that maps 1-to-1 with a database
 * table. The decorators below are read at runtime (thanks to `reflect-metadata`)
 * to build the schema and the SQL.
 *
 * Why classes and not interfaces?
 *   - Interfaces are erased at compile time, so TypeORM cannot inspect them.
 *   - Classes survive compilation and can carry decorators that drive the ORM.
 *
 * Reference: https://typeorm.io/entities
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Artist } from '../artist/entitites/artist.entity';
import { Song } from '../song/song.entity';
import type { AlbumEditionDto } from './dto/album-create.dto';

/**
 * `@Entity()` marks the class as a database table.
 * Default table name = class name in lowercase (`album`). Override with
 * `@Entity('albums')` or `@Entity({ name: 'albums', schema: 'public' })`.
 */
@Entity()
export class Album {
  /**
   * `@PrimaryGeneratedColumn('uuid')` — primary key auto-generated as a v4 UUID.
   *
   * Other strategies:
   *   - `@PrimaryGeneratedColumn()`             → auto-incrementing integer
   *   - `@PrimaryGeneratedColumn('increment')`  → same as above (explicit)
   *   - `@PrimaryGeneratedColumn('uuid')`       → UUID (used here)
   *   - `@PrimaryColumn()`                      → you supply the value yourself
   *
   * UUIDs are preferred for public APIs because they don't leak row counts and
   * are safe to expose in URLs.
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * `@Column({ length: 200 })` — a `varchar(200)` column.
   * Common options: `type`, `length`, `nullable`, `default`, `unique`, `name`.
   */
  @Column({ length: 200 })
  title!: string;

  /**
   * `timestamptz` = "timestamp with time zone" in PostgreSQL — the right choice
   * for storing real-world points in time. `nullable: true` allows `NULL` so a
   * release date can be unknown.
   */
  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  releaseDate!: Date | null;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  editions!: AlbumEditionDto[];

  @OneToMany(() => Song, (song) => song.album)
  songs!: Song[];

  /**
   * A foreign-key-like column stored as `uuid`. In a more advanced setup you'd
   * model this with a real relation (see ManyToOne in the README) but here we
   * keep it as a plain column to focus on basic CRUD.
   */
  @Column('uuid')
  artistId!: string;

  @ManyToOne(() => Artist, (artist) => artist.albums)
  artist!: Artist;

  /**
   * `@CreateDateColumn()` — set automatically by TypeORM the first time the row
   * is saved. You never write to it manually.
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * `@UpdateDateColumn()` — refreshed automatically each time the row is saved
   * after creation. Pairs with `@CreateDateColumn` to give you free audit
   * timestamps without writing any code.
   */
  @UpdateDateColumn()
  updatedAt!: Date | null;

  /**
   * `@DeleteDateColumn()` — enables SOFT DELETE for this entity.
   *
   * When you call `repository.softDelete(id)` TypeORM sets `deletedAt` to NOW()
   * instead of issuing a SQL `DELETE`. Subsequent `find()` calls automatically
   * skip rows where `deletedAt IS NOT NULL`, so soft-deleted rows are hidden
   * from your queries but still recoverable from the database.
   *
   * Useful for: undo, audit trails, GDPR "right to be forgotten" with a grace
   * period, restoring accidentally deleted resources.
   */
  @DeleteDateColumn()
  deletedAt!: Date | null;
}
