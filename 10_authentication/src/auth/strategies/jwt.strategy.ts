import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../types/jwt';
import { AuthUser } from '../types/auth-user';

/**
 * JwtStrategy — teaches Passport HOW to validate a JWT on every guarded request.
 *
 * WHAT IS PASSPORT?
 * Passport.js is a Node.js authentication middleware. It supports 500+
 * "strategies" (local username/password, Google OAuth, Facebook, GitHub, JWT…).
 * Each strategy answers one question: "Is this request authenticated?"
 * NestJS wraps Passport in @nestjs/passport to make it injectable.
 *
 * WHAT IS A STRATEGY?
 * A strategy is a class that knows how to extract credentials from a request
 * and validate them. We register it by name ('jwt') so AuthGuard('jwt') can
 * find and use it.
 *
 * HOW THE FLOW WORKS (high level):
 *   Request arrives
 *     → JwtAuthGuard.canActivate()
 *       → AuthGuard('jwt') asks Passport to run the 'jwt' strategy
 *         → JwtStrategy reads the token from the Authorization header
 *         → passport-jwt verifies the signature + expiry with secretOrKey
 *         → if valid: calls JwtStrategy.validate(payload)
 *         → the return value of validate() is attached to req.user
 *         → guard returns true → controller runs
 *       If any step fails → guard throws UnauthorizedException (401)
 *
 * PassportStrategy(Strategy, 'jwt') — the mixin registers this class under
 * the name 'jwt' so AuthGuard('jwt') can look it up by that string.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    // super() configures the underlying passport-jwt strategy.
    // These options are read ONCE at startup, not per request.
    super({
      // ExtractJwt.fromAuthHeaderAsBearerToken() tells Passport to look for
      // the token in the Authorization header like this:
      //   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5...
      // Other extractors exist: fromUrlQueryParameter, fromBodyField, etc.
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // ignoreExpiration: false (the default, stated explicitly for clarity).
      // When false, an expired token is treated as invalid and validate()
      // is never called. Setting this to true would accept expired tokens —
      // almost never what you want outside of a refresh-token flow.
      ignoreExpiration: false,

      // The same secret used to SIGN tokens in AuthService must be used to
      // VERIFY them here. Both steps must agree or verification fails.
      // We read it from the environment so the secret is never in source code.
      secretOrKey: configService.get<string>('JWT_SECRET')!,

      // algorithms specifies which signing algorithms are accepted.
      // HS256 (HMAC-SHA256) is a symmetric algorithm — same secret to sign and
      // verify. RS256 (asymmetric) is preferred when multiple services verify
      // tokens, because only the auth server needs the private key.
      algorithms: ['HS256'],
    });
  }

  /**
   * validate() is called by Passport AFTER the token signature and expiry
   * have already been verified. The decoded payload is passed in.
   *
   * What we do here:
   *   1. Look up the user from the DB using the email stored in payload.username.
   *   2. Confirm the account still exists (protects against deleted accounts
   *      whose tokens haven't expired yet).
   *   3. Return a minimal AuthUser object — this becomes req.user in controllers.
   *
   * What we do NOT do:
   *   - Re-verify the signature (Passport already did that).
   *   - Load the password hash (not needed for authorization).
   *
   * Throwing UnauthorizedException here causes Passport to reject the request
   * with a 401 response before the controller is reached.
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    try {
      const user = await this.userService.getUserByEmail(payload.username);

      // Return only the fields controllers need. This becomes req.user.
      return { id: user.id, username: user.email };
    } catch {
      // If getUserByEmail throws (user deleted after token was issued, DB error,
      // etc.) we surface a uniform 401. We never tell the caller WHY — leaking
      // "user not found vs token invalid" would aid an attacker enumerating accounts.
      throw new UnauthorizedException();
    }
  }
}
