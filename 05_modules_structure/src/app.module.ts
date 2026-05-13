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

@Module({
  imports: [
    ArtistModule,
    SongModule,
    AlbumModule,
    LoggerModule.forRoot({ level: 'info' }),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
