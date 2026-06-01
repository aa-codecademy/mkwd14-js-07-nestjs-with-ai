/**
 * Song feature module.
 *
 * Two `imports` entries are at play here:
 *
 *   1. `TypeOrmModule.forFeature([Song, Album, Artist])`
 *      Registers THREE repositories in this module's DI scope:
 *        - `Repository<Song>`   — owned: this module is the writer.
 *        - `Repository<Album>`  — read-only, used to validate `albumId`
 *                                 before inserting/updating a song.
 *        - `Repository<Artist>` — read-only, used to validate `artistId`.
 *      Cross-entity FK checks need a repository handle, hence both are
 *      registered here even though they're "owned" by other modules.
 *
 *   2. `ArtistModule`
 *      Re-exports `ArtistService`. Importing the module (instead of the
 *      service directly) is the preferred Nest pattern — it preserves the
 *      module's encapsulation and avoids duplicate `providers` entries.
 *
 * Multiple modules registering the same entity in `forFeature` is fine; the
 * underlying `DataSource` is shared across the whole app.
 */
import { Module } from '@nestjs/common';
import { ArtistModule } from '../artist/artist.module';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from './song.entity';
import { Album } from '../album/album.entity';
import { Artist } from '../artist/entities/artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Song, Album, Artist]), ArtistModule],
  controllers: [SongController],
  providers: [SongService],
})
export class SongModule {}
