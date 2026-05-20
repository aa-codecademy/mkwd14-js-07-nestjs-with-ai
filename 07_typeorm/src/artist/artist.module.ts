/**
 * Feature module for artist use-cases.
 *
 * Important architecture rule:
 * - This module owns ArtistController + ArtistService.
 * - Other modules should consume ArtistService through `exports`, not by re-declaring
 *   ArtistService in their own `providers`.
 */
import { Module } from '@nestjs/common';
import { ArtistController } from './artist.controller';
import { ArtistService } from './artist.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Artist])],
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
