/**
 * Song feature module.
 *
 * Depends on ArtistModule because SongService needs ArtistService for enrichments
 * (e.g. `artistName` in song responses).
 *
 * This is the preferred Nest pattern:
 * - import the module that exports what you need
 * - avoid duplicating foreign services in `providers`
 */
import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { SongController } from './song.controller';
import { SongService } from './song.service';

@Module({
  imports: [ArtistModule],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
