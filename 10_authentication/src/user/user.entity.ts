import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../common/types/user-role';
import type { Playlist } from '../playlist/entities/playlist.entity';

/**
 * User entity — the database table that stores registered accounts.
 *
 * IMPORTANT SECURITY DECISIONS EXPLAINED:
 *
 * 1. We store a PASSWORD HASH, not the plain-text password.
 *    Storing plain-text passwords is a critical vulnerability. If the database
 *    is breached, every user's password is immediately exposed. We store the
 *    output of bcrypt(password, saltRounds) instead. bcrypt is a one-way
 *    function — you can verify a candidate password against the hash, but you
 *    cannot reverse the hash back to the original password.
 *
 * 2. The passwordHash column has { select: false }.
 *    TypeORM excludes this column from ALL SELECT queries by default.
 *    This means repository.find(), findOne(), etc. return User objects where
 *    passwordHash is undefined — it never accidentally leaks into API responses
 *    or logs. The only way to read it is via an explicit QueryBuilder that
 *    calls .addSelect('user.passwordHash') — see UserService.verifyPassword.
 *
 * 3. No @ApiProperty on passwordHash.
 *    We intentionally do NOT expose it in the Swagger schema so it doesn't
 *    appear in the docs, won't be included in generated API clients, and is
 *    never accidentally serialized in a response body.
 *
 * 4. email has { unique: true } which creates a UNIQUE constraint in Postgres.
 *    One account per email address is enforced at the database level, not just
 *    the application level. The application-level check in UserService.createUser
 *    gives us a friendlier error message before the DB constraint fires.
 */
@Entity()
export class User {
  @ApiProperty({
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({ example: 'user@music.com' })
  @Column({ unique: true })
  email!: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  // { select: false } — NEVER included in default SELECT queries.
  // This is the bcrypt hash of the original password, never the password itself.
  // No @ApiProperty — intentionally hidden from Swagger and API responses.
  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'text', nullable: true, select: false })
  refreshTokenHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  refreshTokenExpiry!: Date | null;

  @OneToMany('Playlist', 'owner')
  playlists!: Playlist[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
