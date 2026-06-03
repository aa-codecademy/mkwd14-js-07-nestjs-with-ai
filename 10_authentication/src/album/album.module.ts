/**
 * Album feature module.
 *
 * `TypeOrmModule.forFeature([Album, Artist])` does two things:
 *   1. Tells the global `DataSource` (created in `DatabaseModule`) about the
 *      `Album` entity — combined with `autoLoadEntities: true` in
 *      `database.module.ts`, the table is added to the schema automatically.
 *   2. Registers a `Repository<Album>` AND a `Repository<Artist>` provider
 *      inside this module's DI scope, both available via `@InjectRepository`.
 *
 * Why a `Repository<Artist>` lives here even though `Artist` is owned by
 * `ArtistModule`:
 *   - The album service performs a cross-entity foreign-key check
 *     ("does this artistId actually exist?") before creating an album.
 *   - We could also call `ArtistService.getArtistById()` from `ArtistModule`,
 *     but that adds a service-to-service hop. Using the read-only repository
 *     here keeps the call cheap and isolated.
 *   - Registering a repository in two modules is allowed — `forFeature` is
 *     idempotent at the DataSource level.
 *
 * Rule of thumb: every entity is declared in `forFeature` of the module
 * that OWNS its writes. Other modules may also declare it if they need to
 * READ it directly without going through the owner's service.
 */
import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from './album.entity';
import { Artist } from '../artist/entities/artist.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Album, Artist])],
  controllers: [AlbumController],
  providers: [AlbumService],
})
export class AlbumModule {}
