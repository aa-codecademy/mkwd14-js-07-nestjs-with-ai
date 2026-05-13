import { Module } from '@nestjs/common';
import { ArtistService } from './artist.service';
import {
  ARTIST_ID_GENERATOR,
  type ArtistIdGenerator,
} from '../common/providers/id-generator';
import { ArtistController } from './artist.controller';

@Module({
  imports: [],
  controllers: [ArtistController],
  providers: [
    ArtistService,
    {
      provide: ARTIST_ID_GENERATOR,
      useFactory: (): ArtistIdGenerator => (): number => Date.now(),
    },
  ],
})
export class ArtistModule {}
