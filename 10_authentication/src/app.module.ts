/**
 * AppModule — the root composition module.
 *
 * In NestJS, AppModule should only orchestrate feature modules and register
 * global cross-cutting concerns. Business logic lives in feature modules.
 *
 * GLOBAL GUARDS (the key auth wiring in this file):
 *
 *   APP_GUARD is a special NestJS injection token. Every provider registered
 *   with { provide: APP_GUARD, useClass: SomeGuard } is applied to ALL routes
 *   in the entire application, automatically — no @UseGuards() needed anywhere.
 *
 *   Order matters: guards run in the order they are listed here.
 *     1. JwtAuthGuard runs FIRST — validates the JWT and populates req.user.
 *        Routes decorated with @Public() are skipped (returns true immediately).
 *     2. RolesGuard runs SECOND — checks req.user.role against @Roles(...).
 *        It depends on req.user being set by JwtAuthGuard, so order is critical.
 *
 *   This "secure by default" pattern means:
 *     - Adding a new controller → it is automatically protected by JWT auth.
 *     - You must explicitly opt out with @Public() for unauthenticated routes.
 *     - You must explicitly opt in role restrictions with @Roles() per endpoint.
 *
 *   The alternative (adding @UseGuards(JwtAuthGuard) to every controller) is
 *   error-prone — a developer can forget it and accidentally expose a route.
 *
 * LoggerModule.forRoot(...) is the Dynamic Module pattern:
 *   receives configuration once at startup and provides configured services globally.
 */
import { Module } from '@nestjs/common';
import { AlbumModule } from './album/album.module';
import { AppController } from './app.controller';
import { ArtistModule } from './artist/artist.module';
import { LoggerModule } from './logger/logger.module';
import { SongModule } from './song/song.module';
import { DatabaseModule } from './db/database.module';
import { PlaylistModule } from './playlist/playlist.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    ArtistModule,
    SongModule,
    AlbumModule,
    LoggerModule.forRoot({ level: 'info' }),
    DatabaseModule,
    PlaylistModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    // Guard #1 — authentication: is there a valid JWT? (runs first)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Guard #2 — authorization: does the user have the required role? (runs second)
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
