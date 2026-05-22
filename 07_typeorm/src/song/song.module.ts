/**
 * Song feature module.
 *
 * Depends on ArtistModule because SongService needs ArtistService for enrichments
 * (e.g. `artistName` in song responses).
 *
 * This is the preferred Nest pattern:
 * - import the module that exports what you need
 * - avoid duplicating foreign services in `providers`
 *
 * Two `imports` entries are at play here:
 *   - `TypeOrmModule.forFeature([Song])` → provides a `Repository<Song>` to
 *     this module. The repository is injected into `SongService`.
 *   - `ArtistModule`                     → re-exports `ArtistService` so this
 *     module can ask the artist domain for data, without ever holding a direct
 *     `Repository<Artist>` (encapsulation).
 */
import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { Album } from '../album/album.entity';
import { Artist } from '../artist/artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Album, Artist]), ArtistModule],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
