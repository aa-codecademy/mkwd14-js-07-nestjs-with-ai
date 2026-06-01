/**
 * ArtistProfile entity — extra metadata about an Artist (country, city,
 * booking email, website). Kept in its own table for two reasons:
 *
 *   1. Separation of concerns — the core `Artist` row is small and read often;
 *      profile fields are accessed less frequently.
 *   2. Optional nature — an artist can exist without a profile.
 *
 * This file is the OWNING side of the Artist↔ArtistProfile `@OneToOne`
 * relation. "Owning side" means it carries the foreign key column and the
 * `@JoinColumn()` decorator. The INVERSE side is `Artist.profile`.
 *
 * One-to-one rule of thumb: put the FK on the OPTIONAL side (here:
 * `ArtistProfile`), so the parent (`Artist`) does not store a nullable FK.
 */
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Artist } from './artist.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class ArtistProfile {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id!: string;

  /**
   * Required `varchar` — every profile must declare a country. No type/length
   * given → TypeORM falls back to the driver default (`varchar(255)` for pg).
   */
  @Column()
  @ApiProperty({
    example: 'United Kingdom',
  })
  country!: string;

  /**
   * Optional fields. We use the verbose `{ type: 'varchar', nullable: true }`
   * form (instead of the shorthand `@Column({ nullable: true })`) so the TS
   * type `string | null` matches the SQL column exactly. With `nullable: true`
   * you almost always want to type the field as `T | null` in TS.
   */
  @Column({
    type: 'varchar',
    nullable: true,
  })
  @ApiProperty({
    type: String,
    nullable: true,
    example: 'London',
  })
  city!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  bookingEmail!: string | null;

  @Column({
    type: 'varchar',
    nullable: true,
  })
  @ApiProperty({
    type: String,
    nullable: true,
  })
  website!: string | null;

  /**
   * Foreign-key column for the relation below. Declared explicitly so it can
   * be set/queried directly without loading the related Artist entity.
   */
  @Column('uuid')
  @ApiProperty({
    type: String,
    nullable: true,
  })
  artistId!: string;

  /**
   * `@OneToOne(() => Artist, artist => artist.profile)` + `@JoinColumn()` —
   * the OWNING side. `@JoinColumn()` does two things:
   *
   *   1. it tells TypeORM "the FK column lives on THIS table",
   *   2. by default it links our `artist` relation to the `artistId` column
   *      declared above (matching name convention).
   *
   * You can override the column name: `@JoinColumn({ name: 'artist_uuid' })`.
   *
   * Common extras you'll see in real apps:
   *   - `{ onDelete: 'CASCADE' }` so deleting an artist cleans up the profile
   *   - `{ unique: true }` to enforce 1:1 at the DB level (already implied by
   *     `@OneToOne` + `@JoinColumn`, but worth knowing)
   */
  @OneToOne(() => Artist, (artist) => artist.profile)
  @JoinColumn()
  artist!: Artist;

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  @ApiProperty({
    type: Date,
  })
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
