import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../auth/dto/login.dto';

/**
 * UserService — all database operations for the User entity.
 *
 * This service is intentionally separate from AuthService:
 *   AuthService  = orchestrates the authentication FLOW (register, login, tokens)
 *   UserService  = owns the USER DATA (CRUD, password hashing, verification)
 *
 * This separation follows the Single Responsibility Principle. If we later add
 * OAuth login (Google, GitHub), the new strategy can reuse UserService.createUser
 * without touching any JWT logic.
 *
 * UserModule exports this service so AuthModule can import it and inject it into
 * AuthService and JwtStrategy.
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * getUserByEmail() — loads a user record by email address.
   *
   * Because passwordHash has { select: false } on the entity, this query
   * returns a User WITHOUT the hash. It is safe to return in API responses
   * or pass to JwtStrategy.validate() where the hash is not needed.
   *
   * Throws NotFoundException (404) when no matching user exists.
   * Note: AuthService.login wraps this in try/catch and converts the 404
   * into a generic 400 to prevent email enumeration.
   */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getUserByRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .addSelect('user.refreshTokenExpiry')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiry) {
      throw new NotFoundException(`User with ID: ${userId} not found.`);
    }

    if (user.refreshTokenExpiry < new Date()) {
      throw new ForbiddenException('Token expiry date has expired.');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      throw new ForbiddenException('Refresh token is not valid');
    }

    return user;
  }

  /**
   * createUser() — registers a new account.
   *
   * FLOW:
   *   1. Normalize email to lowercase — "User@Example.com" and "user@example.com"
   *      should be the same account. Without normalization, the same person could
   *      register multiple times just by changing case.
   *
   *   2. Uniqueness check — throw ConflictException (409) if email is taken.
   *      We do this at the application level (before hashing) to give a friendly
   *      error message. The DB UNIQUE constraint is the final safety net.
   *
   *   3. bcrypt.hash(password, saltRounds)
   *      bcrypt is a deliberately slow hashing algorithm designed for passwords.
   *      The second argument (10) is the "cost factor" / "salt rounds":
   *        - It controls how many rounds of processing bcrypt performs.
   *        - Higher = more CPU time per hash = harder for attackers to brute-force.
   *        - Cost 10 ≈ ~100ms per hash on modern hardware (OWASP minimum).
   *        - bcrypt also generates and embeds a random salt automatically, so two
   *          users with the same password get completely different hashes.
   *      NEVER use fast hashes like MD5, SHA-1, or SHA-256 for passwords —
   *      they are designed to be fast, which makes brute-forcing trivial.
   *
   *   4. repository.create() + repository.save() — standard TypeORM insert.
   *      The returned user has passwordHash excluded (select: false).
   */
  async createUser(credentials: RegisterDto): Promise<User> {
    const email = credentials.email.toLowerCase();

    const existingUser = await this.userRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Cost 10 is the OWASP-recommended minimum and keeps bcrypt from blocking
    // the Node.js event loop for too long on each registration.
    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const user = this.userRepository.create({
      email,
      passwordHash,
    });

    const createdUser = await this.userRepository.save(user);

    return createdUser;
  }

  async saveRefreshToken(
    userId: string,
    refreshToken: string,
    expiry: Date,
  ): Promise<void> {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    console.log(
      '🚀 ~ UserService ~ saveRefreshToken ~ hashedToken:',
      hashedToken,
    );

    await this.userRepository.update(userId, {
      refreshTokenHash: hashedToken,
      refreshTokenExpiry: expiry,
    });
  }

  /**
   * verifyPassword() — checks if the provided plain-text password matches the
   * stored bcrypt hash for the given email.
   *
   * WHY DO WE USE createQueryBuilder INSTEAD OF findOneBy?
   *   The User entity's passwordHash column has { select: false }. This means
   *   ALL standard find* methods (findOneBy, find, findOne) exclude it from
   *   the SELECT clause. We NEED the hash here to run bcrypt.compare, so we
   *   must use createQueryBuilder with .addSelect('user.passwordHash') to
   *   explicitly opt that column back in for this one query.
   *
   * HOW bcrypt.compare WORKS:
   *   bcrypt.compare(plainPassword, storedHash) does NOT re-hash the plain
   *   password and compare the two hashes. Instead, it extracts the original
   *   salt embedded in the stored hash, re-runs the bcrypt algorithm with
   *   that salt + the candidate password, and then compares the result.
   *   This is why comparing always works even though bcrypt is non-deterministic
   *   on its own (different salts each time).
   *
   * TIMING SAFETY:
   *   bcrypt.compare uses a constant-time comparison internally, which prevents
   *   timing attacks (where an attacker measures how long comparisons take to
   *   deduce information about the hash).
   *
   * Returns false (not an exception) when the user doesn't exist or the
   * password is wrong — the caller (AuthService.login) decides what error to
   * surface.
   */
  async verifyPassword(credentials: LoginDto): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash') // explicitly opt-in the hidden column
      .where('user.email = :email', { email: credentials.email.toLowerCase() })
      .getOne();

    if (!user) return false;

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash,
    );

    return isPasswordValid;
  }
}
