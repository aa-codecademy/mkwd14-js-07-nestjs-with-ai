import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

/**
 * AuthModule — wires together every piece of the authentication system.
 *
 * A NestJS module is a boundary that groups related providers and declares
 * what they need from the outside world (imports) and what they offer to
 * other modules (exports).
 *
 * IMPORTS breakdown:
 *
 *   UserModule
 *     AuthModule needs to look up users and verify passwords. UserModule
 *     exports UserService, so by importing UserModule here we can inject
 *     UserService into AuthService and JwtStrategy.
 *
 *   PassportModule
 *     Registers Passport.js into Nest's DI system. This is the prerequisite
 *     for AuthGuard and PassportStrategy to work. Without it, the 'jwt'
 *     strategy can't be found at runtime.
 *
 *   JwtModule.registerAsync(...)
 *     Registers JwtService so it can be injected into AuthService for
 *     signing tokens with jwtService.signAsync().
 *
 *     registerAsync (vs plain register) lets us read config values from
 *     ConfigService (which reads .env) at boot time instead of hard-coding
 *     them. The useFactory callback receives the injected ConfigService
 *     and returns the config object once environment variables are loaded.
 *
 *     secret      — the HMAC key used to sign tokens. Must match the key
 *                   used by JwtStrategy to verify them.
 *     expiresIn   — how long a token is valid (e.g. '60s', '15m', '7d').
 *                   Short-lived tokens reduce the damage window if a token
 *                   is leaked (a stolen token expires soon on its own).
 *
 * PROVIDERS:
 *   AuthService  — login and register logic
 *   JwtStrategy  — registered as a provider so Passport can discover it
 *                  and run it when AuthGuard('jwt') is triggered
 *
 * EXPORTS:
 *   AuthService is exported in case other modules need to call register/login
 *   programmatically (e.g. a seeding module during tests or a CLI command).
 */
@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
