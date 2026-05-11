import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArtistController } from './artist/artist.controller';
import { ArtistService } from './artist/artist.service';
import {
  ARTIST_ID_GENERATOR,
  type ArtistIdGenerator,
} from './common/providers/id-generator';

@Module({
  imports: [],
  controllers: [AppController, ArtistController],
  providers: [
    ArtistService,
    {
      provide: ARTIST_ID_GENERATOR,
      useFactory: (): ArtistIdGenerator => (): number => Date.now(),
    },
  ],
})
export class AppModule {}
