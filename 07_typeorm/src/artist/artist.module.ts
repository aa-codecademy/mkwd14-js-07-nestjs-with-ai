/**
 * Feature module for artist use-cases.
 *
 * Important architecture rule:
 * - This module owns ArtistController + ArtistService.
 * - Other modules should consume ArtistService through `exports`, not by re-declaring
 *   ArtistService in their own `providers`.
 *
 * Why `TypeOrmModule.forFeature([Artist])`?
 *   - It declares this entity at the module level so the connection (created by
 *     `DatabaseModule.forRoot`) knows about it and creates a repository for it.
 *   - It makes `Repository<Artist>` available for injection inside this module.
 *     `ArtistService` claims it with `@InjectRepository(Artist)`.
 *
 * Why `exports: [ArtistService]`?
 *   - Services are scoped to the module that declares them. `SongModule` needs
 *     to use `ArtistService`, so we expose it. NOTE: we do NOT need to export
 *     `TypeOrmModule.forFeature` because the repository is an implementation
 *     detail — consumers go through the service, not the repository.
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
