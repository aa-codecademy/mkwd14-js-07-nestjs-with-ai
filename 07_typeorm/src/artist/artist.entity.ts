/**
 * Artist entity — maps to the `artist` table.
 *
 * Read the `album.entity.ts` file first; it explains the role of every decorator
 * you see here in more detail. This file shows two extras:
 *
 *   - `@Column({ length: 30 })`  → a shorter `varchar` for the genre slug
 *   - `@Column({ type: 'int', nullable: true })` → an optional integer column
 *     for an artist's debut year (some artists may not have one set).
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
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Album } from '../album/album.entity';
import { Song } from '../song/song.entity';

@Entity()
export class Artist {
  /** UUID primary key — see album.entity.ts for the full list of strategies. */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** `varchar(120)`. Use `length` to set a sensible upper bound and keep indexes small. */
  @Column({ length: 120 })
  name!: string;

  /**
   * Stored as `varchar(30)`. In a richer model you could use a Postgres `enum`:
   *   `@Column({ type: 'enum', enum: Genre })`
   * which gives DB-level validation in addition to your DTO rules.
   */
  @Column({ length: 30 })
  genre!: string;

  /** `boolean` column. Type is inferred from the TS field type when not given. */
  @Column()
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
  debutYear!: number | null;

  @OneToMany(() => Song, (song) => song.artist)
  songs!: Song[];

  @OneToMany(() => Album, (album) => album.artist)
  albums!: Album[];

  /** Auto-managed audit columns — see album.entity.ts for details. */
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date | null;

  /** Enables `repository.softDelete(...)` for this entity. */
  @DeleteDateColumn()
  deletedAt!: Date | null;
}
