/**
 * Artist entity — maps to the `artist` table.
 *
 * Read `album.entity.ts` first; it explains the role of common decorators in
 * more detail. This file is the most "feature-rich" entity in the project and
 * adds:
 *
 *   - a Postgres `enum` column (`genre`)
 *   - a `simple-array` column (`aliases`)
 *   - TWO `@OneToMany` relations  (Artist → Song, Artist → Album)
 *   - ONE `@OneToOne` relation    (Artist → ArtistProfile)
 *
 * Every relation declared here is the INVERSE side: it stores no column on
 * the `artist` table, it just lets you navigate the graph in code, e.g.
 * `artist.songs`, `artist.albums`, `artist.profile`.
 *
 * The `!` on every field is a TypeScript "definite assignment assertion". It
 * tells the compiler "trust me, this will be initialized" — TypeORM (or our
 * service code via `repository.create(...)`) fills these in at runtime.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Album } from '../../album/album.entity';
import { Song } from '../../song/song.entity';
import { ArtistProfile } from './artist-profile.entity';
import { Genre } from '../../common/types/genre';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Artist {
  /** UUID primary key — see album.entity.ts for the full list of strategies. */
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id!: string;

  /** `varchar(120)`. Use `length` to set a sensible upper bound and keep indexes small. */
  @Column({ length: 120 })
  @ApiProperty()
  name!: string;

  /**
   * Postgres `enum` column.
   *
   * `{ type: 'enum', enum: Genre }` tells TypeORM to:
   *   1. CREATE TYPE "artist_genre_enum" AS ENUM ('rock', 'pop', …)
   *   2. use that type for this column
   *
   * Benefits over a plain `varchar`:
   *   - Database-level validation: invalid values are rejected by Postgres.
   *   - Smaller storage and faster comparisons than text.
   *   - Self-documenting — the schema lists allowed values.
   *
   * Caveat: adding new enum values needs an `ALTER TYPE … ADD VALUE …`
   * migration in production (you can't just edit the TS enum and ship).
   */
  @Column({ type: 'enum', enum: Genre, nullable: true })
  @ApiProperty({ enum: Genre })
  genre!: Genre;

  /** `boolean` column. Type is inferred from the TS field type when not given. */
  @Column()
  @ApiProperty()
  isActive!: boolean;

  /**
   * `int NULL`. The field is `number | null` in TS to mirror the DB nullability.
   * Keeping TypeScript types honest about nullability is a tiny but important
   * habit — it prevents `NullPointerException`-style bugs at runtime.
   */
  @Column({
    type: 'int',
    nullable: true,
  })
  @ApiProperty({
    type: Number,
    nullable: true,
  })
  debutYear!: number | null;

  /**
   * `simple-array` — TypeORM's "lazy" array storage.
   *
   * Under the hood it's a single `text` column where TypeORM joins values
   * with commas: `["AC/DC", "Acca Dacca"]` becomes `"AC/DC,Acca Dacca"`.
   *
   * Pros: zero schema overhead — no extra table.
   * Cons:
   *   - cannot store values containing commas,
   *   - cannot index individual elements,
   *   - cannot query "where 'X' is in the array" cleanly.
   *
   * For richer use-cases prefer a real Postgres array (`text[]`),
   * `simple-json`, `jsonb`, or a child table with a `@OneToMany`.
   */
  @Column({ type: 'simple-array', nullable: true })
  @ApiProperty({
    type: [String],
    // isArray: true,
    nullable: true,
  })
  aliases!: string[] | null;

  /**
   * `@OneToMany(() => Song, song => song.artist)` — INVERSE side of the
   * Song→Artist relation. The owning `@ManyToOne` lives on `Song.artist`.
   *
   * Practical use:
   *   artistRepository.findOne({
   *     where: { id },
   *     relations: { songs: true },   // populates `artist.songs`
   *   });
   */
  @OneToMany(() => Song, (song) => song.artist)
  @ApiProperty({
    type: [Song],
  })
  songs!: Song[];

  /** Same pattern as `songs` above, but for albums. */
  @OneToMany(() => Album, (album) => album.artist)
  @ApiProperty({
    type: [Album],
  })
  albums!: Album[];

  /**
   * `@OneToOne(() => ArtistProfile, profile => profile.artist)` —
   * INVERSE side of a one-to-one relation.
   *
   * The OWNING side (the one with the FK column AND `@JoinColumn()`) is on
   * `ArtistProfile.artist`. We deliberately put the FK there because the
   * profile is "secondary" data: an artist exists with or without a profile,
   * but a profile never exists without an artist.
   */
  @OneToOne(() => ArtistProfile, (profile) => profile.artist)
  @ApiProperty({
    type: ArtistProfile,
  })
  profile!: ArtistProfile;

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  @ApiProperty()
  createdAt!: Date;

  @UpdateDateColumn()
  @ApiProperty({
    type: Date,
    nullable: true,
  })
  updatedAt!: Date | null;

  /** Enables `repository.softDelete(...)` for this entity. */
  @DeleteDateColumn()
  @ApiProperty({
    type: Date,
    nullable: true,
  })
  deletedAt!: Date | null;
}
