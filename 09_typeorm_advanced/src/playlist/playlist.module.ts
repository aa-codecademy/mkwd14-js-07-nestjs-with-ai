/**
 * Playlist feature module.
 *
 * `TypeOrmModule.forFeature([Playlist, Song])` registers TWO repositories:
 *   - `Repository<Playlist>`  — owned (this module is the writer).
 *   - `Repository<Song>`      — read-only, used to LOAD song entities by id
 *                                before linking them through the
 *                                `playlist_songs` junction table.
 *
 * You'll notice this module does NOT import `SongModule` (unlike `SongModule`
 * which imports `ArtistModule`). The reason is encapsulation:
 *   - We only need to READ songs, not invoke any business logic from
 *     `SongService` — `forFeature([Song])` is enough.
 *   - Keeping the import surface small avoids accidental coupling.
 */
import { Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Playlist } from './entities/playlist.entity';
import { Song } from '../song/song.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Playlist, Song])],
  controllers: [PlaylistController],
  providers: [PlaylistService],
})
export class PlaylistModule {}
