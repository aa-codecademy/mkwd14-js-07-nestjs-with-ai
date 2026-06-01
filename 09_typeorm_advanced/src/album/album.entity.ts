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

  /**
   * `jsonb` column — stores arbitrary JSON natively in PostgreSQL.
   *
   * Use it when:
   *   - the shape of the data varies row to row,
   *   - you don't need to JOIN against this data,
   *   - you need fast indexed JSON queries (`jsonb` supports GIN indexes
   *     and operators like `->`, `->>`, `@>`).
   *
   * Trade-off vs. a child table: you cannot enforce FK constraints inside
   * JSON, validation is YOUR responsibility (we use the DTO for that — see
   * `AlbumEditionDto` in `dto/album-create.dto.ts`).
   *
   * Read more: https://www.postgresql.org/docs/current/datatype-json.html
   */
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  editions!: AlbumEditionDto[];

  /**
   * `@OneToMany(() => Song, song => song.album)` — the "many" side of the
   * Album↔Song relation lives in `Song.album`. This decorator is the INVERSE
   * side and stores NO column on the album table; it just lets you do:
   *
   *     albumRepository.findOne({ where: { id }, relations: { songs: true } })
   *
   * to get an album with all its tracks loaded. The actual foreign key lives
   * on the `song` table (see `Song.albumId`).
   */
  @OneToMany(() => Song, (song) => song.album)
  songs!: Song[];

  /**
   * Plain UUID column that ALSO acts as the foreign key for the relation
   * declared just below. Keeping the FK column explicit (instead of letting
   * `@ManyToOne` create a hidden `artistId` column) is useful because:
   *   - we can write `body.artistId` from the controller without loading the
   *     full Artist entity,
   *   - it's easy to filter by `where: { artistId }` without joining,
   *   - it makes the schema obvious to anyone reading the code.
   */
  @Column('uuid')
  artistId!: string;

  /**
   * `@ManyToOne(() => Artist, artist => artist.albums)` — many albums can
   * belong to one artist. This is the OWNING side of the relation and the
   * one that contributes the foreign-key column. TypeORM will:
   *   - reuse our `artistId` column as the FK (because the names line up), or
   *   - create one named `artistId` automatically if we hadn't.
   *
   * The arrow function is a "lazy import" — it defers resolving `Artist`
   * until runtime so circular imports between entity files don't blow up.
   *
   * Useful options you can pass as a 3rd argument:
   *   - `{ onDelete: 'CASCADE' }`  → delete albums when the artist is deleted
   *   - `{ eager: true }`          → always load the artist with the album
   *   - `{ nullable: false }`      → make the FK column NOT NULL
   */
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
