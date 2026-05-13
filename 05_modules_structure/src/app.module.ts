/**
 * Application wiring: controllers + injectable services + one **custom provider**.
 *
 * `ArtistService` is a normal class provider (`@Injectable`).
 * `ARTIST_ID_GENERATOR` uses `useFactory` so Nest calls the factory once and injects the returned
 * function wherever `@Inject(ARTIST_ID_GENERATOR)` appears — useful for swapping implementations in tests.
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArtistModule } from './artist/artist.module';
import { SongModule } from './song/song.module';
import { AlbumModule } from './album/album.module';
import { LoggerModule } from './logger/logger.module';

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
