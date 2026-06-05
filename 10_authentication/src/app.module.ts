/**
 * Root composition module.
 *
 * In Nest, `AppModule` should only orchestrate feature modules and global cross-cutting modules.
 * Keep business logic in feature modules (`ArtistModule`, `SongModule`, `AlbumModule`).
 *
 * `LoggerModule.forRoot(...)` is a Dynamic Module pattern:
 * - receives config once at startup
 * - provides configured services app-wide
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
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
