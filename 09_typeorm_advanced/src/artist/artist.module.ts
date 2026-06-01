/**
 * Feature module for artist use-cases.
 *
 * Owns TWO entities:
 *   - `Artist`         — the core record
 *   - `ArtistProfile`  — extra metadata (1:1 with Artist), see
 *                        `entitites/artist-profile.entity.ts`
 *
 * Both are registered together in a single `forFeature(...)` call so the
 * matching `Repository<Artist>` and `Repository<ArtistProfile>` are
 * available for injection in `ArtistService`. The service writes to both
 * inside `createArtist()` to keep the artist and its profile in sync.
 *
 * Why `exports: [ArtistService]`?
 *   - Services are scoped to the module that declares them. Other modules
 *     (e.g. `SongModule`) need to use `ArtistService`, so we expose it.
 *   - We do NOT export the repositories — they're an implementation detail.
 *     Consumers should go through the service, not the raw repository.
 *
 * Important architecture rule:
 *   - This module is the SINGLE WRITER for the `artist` and `artist_profile`
 *     tables. Other modules may register a read-only `Repository<Artist>`
 *     for FK existence checks (see `AlbumModule`), but mutations stay here.
 */
import { Module } from '@nestjs/common';
import { ArtistController } from './artist.controller';
import { ArtistService } from './artist.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './entities/artist.entity';
import { ArtistProfile } from './entities/artist-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Artist, ArtistProfile])],
  controllers: [ArtistController],
  providers: [ArtistService],
  exports: [ArtistService],
})
export class ArtistModule {}
