/**
 * Domain logic for artists, backed by TypeORM's `Repository<Artist>`.
 *
 * Architecture notes:
 *   - This service owns ALL writes/reads against the `artist` table. Nothing
 *     else in the app should touch `artistRepository` directly — other modules
 *     ask `ArtistService` instead.
 *   - Dependency direction is strictly one-way: `Song -> Artist`. Keeping it
 *     acyclic prevents Nest's classic circular-DI pitfalls.
 *
 * Repository API in a nutshell:
 *   - `create(dto)`               – builds an entity instance (no DB call)
 *   - `save(entity)`              – INSERT or UPDATE depending on PK
 *   - `find(options?)`            – returns array, excludes soft-deleted rows
 *   - `findOneBy(criteria)`       – returns one row or null
 *   - `update(id, partial)`       – raw UPDATE, no hooks, returns affected count
 *   - `softDelete(id)`            – sets `deletedAt`, keeps the row
 *   - `restore(id)`               – clears `deletedAt`
 *   - `delete(id)`                – hard DELETE (irreversible)
 *   See: https://typeorm.io/repository-api
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import type { ArtistCreateDto } from './dto/artist-create.dto';
import type { ArtistPartialUpdateDto } from './dto/artist-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Artist } from './artist.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class ArtistService {
  constructor(
    /**
     * `@InjectRepository(Artist)` resolves the `Repository<Artist>` provider
     * that `TypeOrmModule.forFeature([Artist])` registered in `ArtistModule`.
     * This is how Nest connects DI to TypeORM.
     */
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Returns every artist. Note: we return the Repository's Promise directly —
   * no need to mark the method `async` for a one-liner pass-through.
   * In a real app you would add pagination (`take`/`skip`) here.
   */
  getAllArtists(): Promise<Artist[]> {
    return this.artistRepository.find();
  }

  /** Throws Nest `NotFoundException` → HTTP 404 via the default exception layer. */
  async getArtistById(id: string): Promise<Artist> {
    const artist = await this.artistRepository.findOneBy({ id });

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  /**
   * Notice how we don't pass `body` directly to `create()` — we explicitly
   * pick only the fields we want. This is defense-in-depth on top of
   * `whitelist: true` in `ValidationPipe`: even if a rogue field slipped
   * through, it would never reach the database.
   */
  async createArtist(body: ArtistCreateDto): Promise<Artist> {
    const newArtist = this.artistRepository.create({
      name: body.name,
      genre: body.genre,
      isActive: body.isActive,
      debutYear: body.debutYear,
    });

    const savedArtist = await this.artistRepository.save(newArtist);

    return savedArtist;
  }

  /** PUT semantics — replace entire entity except the stable primary key from the URL. */
  // updateArtist(id: string, body: ArtistUpdateDto): ArtistDto {
  //   const existingArtistIndex = this.artists.findIndex(
  //     (artist) => artist.id === id,
  //   );

  //   if (existingArtistIndex === -1) {
  //     throw new NotFoundException(`Artist with ID ${id} not found`);
  //   }

  //   this.artists[existingArtistIndex] = {
  //     ...body,
  //     id,
  //   };

  //   return this.artists[existingArtistIndex];
  // }

  /**
   * PATCH (partial update). Steps:
   *   1. Load the existing entity (throws 404 if missing).
   *   2. Merge the incoming partial DTO over the loaded entity.
   *   3. `save()` performs an UPDATE (the PK is set, so TypeORM knows).
   *
   * Why load-then-merge rather than `repository.update(id, body)` directly?
   *   - We get a NotFound error if the artist doesn't exist.
   *   - We return the fully hydrated row to the caller (`update()` does not).
   *   - Entity lifecycle hooks (`@BeforeUpdate`, etc.) fire on `save()`.
   */
  async partiallyUpdateArtist(
    id: string,
    body: ArtistPartialUpdateDto,
  ): Promise<Artist> {
    const artist = await this.getArtistById(id);

    const updatedArtist = await this.artistRepository.save({
      ...artist,
      ...body,
    });

    return updatedArtist;
  }

  /** Soft delete — see `album.service.ts` for the full explanation. */
  async deleteArtist(id: string): Promise<void> {
    await this.artistRepository.softDelete(id);
  }
}
