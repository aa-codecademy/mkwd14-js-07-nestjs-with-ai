/**
 * Feature module for artist use-cases.
 *
 * Important architecture rule:
 * - This module owns ArtistController + ArtistService.
 * - Other modules should consume ArtistService through `exports`, not by re-declaring
 *   ArtistService in their own `providers`.
 */
import { Module } from '@nestjs/common';
import {
    ARTIST_ID_GENERATOR,
    type ArtistIdGenerator,
} from '../common/providers/id-generator';
import { ArtistController } from './artist.controller';
import { ArtistService } from './artist.service';

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
  exports: [ArtistService],
})
export class ArtistModule {}
