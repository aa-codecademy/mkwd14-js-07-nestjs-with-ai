import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import type { User } from '../user/user.entity';
import type { LoginDto } from './dto/login.dto';
import { LoggerService } from '../logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './types/jwt';
import { ConfigService } from '@nestjs/config/dist/config.service';
import type { RefreshDto } from './dto/refresh.dto';

/**
 * AuthService — the brain of the authentication system.
 *
 * This service orchestrates two flows:
 *   1. REGISTRATION  — create an account (delegates to UserService which hashes
 *                       the password before saving it)
 *   2. LOGIN         — verify credentials and issue a JWT access token
 *
 * It intentionally knows nothing about HTTP (no Request/Response objects).
 * That separation means AuthService can be tested or reused without spinning
 * up an HTTP server.
 *
 * Dependencies injected:
 *   UserService   — DB operations for users (create, lookup, password check)
 *   LoggerService — structured logging (errors logged here, not swallowed)
 *   JwtService    — from @nestjs/jwt, signs and verifies tokens
 *   ConfigService — reads JWT_SECRET and JWT_EXPIRES_IN from the .env file
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * register() — creates a new user account.
   *
   * The heavy lifting (email uniqueness check, bcrypt hashing, DB insert) lives
   * in UserService.createUser. AuthService is just a thin pass-through here,
   * which is fine — the controller should not call UserService directly because
   * in a larger app AuthService would be the place to add welcome emails,
   * analytics events, role assignment, etc.
   */
  register(credentials: RegisterDto): Promise<User> {
    const user = this.userService.createUser(credentials);

    return user;
  }

  /**
   * login() — verifies credentials and returns a JWT access token.
   *
   * STEP-BY-STEP LOGIN FLOW:
   *
   *   1. getUserByEmail  — find the user by email.
   *                        Throws NotFoundException if no account exists.
   *
   *   2. verifyPassword  — run bcrypt.compare(inputPassword, storedHash).
   *                        Returns false if the password is wrong.
   *                        NOTE: verifyPassword uses a custom QueryBuilder that
   *                        explicitly selects passwordHash — the column has
   *                        { select: false } on the entity so normal find()
   *                        calls don't include it.
   *
   *   3. Build the JWT payload (sub + username). Keep it minimal — this data
   *      travels in every HTTP request from now on.
   *
   *   4. jwtService.signAsync() — creates a signed JWT string.
   *        Header:  { alg: 'HS256', typ: 'JWT' }
   *        Payload: { sub, username, iat (issued-at), exp (expiry) }
   *        Signature: HMACSHA256(base64(header) + '.' + base64(payload), secret)
   *
   *   5. Return { user, accessToken } — the client stores the token and sends
   *      it on future requests as:  Authorization: Bearer <accessToken>
   *
   * WHY CATCH EVERYTHING AND THROW BadRequestException?
   *   User enumeration protection: if we let NotFoundException ("user not found")
   *   bubble up, an attacker can determine which emails are registered by trying
   *   different addresses. By catching all errors and returning the same generic
   *   "Invalid credentials" message, both "no such user" and "wrong password"
   *   are indistinguishable from the outside.
   *
   *   We still LOG the real error so developers can debug without exposing it
   *   to the caller.
   */
  async login(credentials: LoginDto) {
    try {
      const user = await this.userService.getUserByEmail(credentials.email);

      const isPasswordValid =
        await this.userService.verifyPassword(credentials);

      if (!isPasswordValid) {
        throw new BadRequestException('Invalid credentials');
      }

      // Build the JWT payload — only non-sensitive, stable identifiers.
      // sub = "subject" (RFC 7519 standard claim) = user's UUID.
      const payload: JwtPayload = { sub: user.id, username: user.email };

      // signAsync creates the signed token string.
      // We pass secret + expiresIn explicitly here (even though JwtModule is
      // configured with defaults in auth.module.ts) so that each login call
      // always uses the current env values — useful if secrets ever rotate.
      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      });

      // const days = parseInt(
      //   this.configService.get('JWT_REFRESH_EXPIRES_IN')!,
      //   10,
      // );

      // const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      // For testing purposes
      const minutes = 2;
      const expiry = new Date(Date.now() + minutes * 60 * 1000);
      await this.userService.saveRefreshToken(user.id, refreshToken, expiry);

      // Return the user record (passwordHash is excluded by { select: false })
      // alongside the token so the client can bootstrap its UI immediately
      // without a separate GET /me call.
      return { user, accessToken, refreshToken };
    } catch (error: unknown) {
      // Log the real error for debugging, but NEVER forward it to the caller.
      this.logger.error('AuthService | Login error:', JSON.stringify(error));
      throw new BadRequestException('Invalid credentials');
    }
  }

  async refresh(body: RefreshDto) {
    try {
      const user = await this.userService.getUserByRefreshToken(
        body.userId,
        body.refreshToken,
      );

      const payload: JwtPayload = { sub: user.id, username: user.email };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      });

      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      });

      // const days = parseInt(
      //   this.configService.get('JWT_REFRESH_EXPIRES_IN')!,
      //   10,
      // );

      // const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      // For testing purposes
      const minutes = 2;
      const expiry = new Date(Date.now() + minutes * 60 * 1000);
      await this.userService.saveRefreshToken(user.id, refreshToken, expiry);

      return { user, accessToken, refreshToken };
    } catch (error: unknown) {
      this.logger.error('AuthService: Refresh: ', JSON.stringify(error));

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
