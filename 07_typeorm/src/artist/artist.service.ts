/**
 * Domain logic for artists, backed by TypeORM's `Repository<Artist>` and
 * `Repository<ArtistProfile>`.
 *
 * Architecture notes:
 *   - This service is the SINGLE WRITER for both `artist` and
 *     `artist_profile` tables. Other modules may read those tables (e.g.
 *     `AlbumService` reads `Artist` to validate `artistId`), but they must
 *     not modify them — go through this service instead.
 *   - Dependency direction is strictly one-way: `Song -> Artist`,
 *     `Album -> Artist`. Keeping it acyclic prevents Nest's classic
 *     circular-DI pitfalls.
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
import { ArtistCreateDto } from './dto/artist-create.dto';
import { ArtistPartialUpdateDto } from './dto/artist-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Artist } from './entitites/artist.entity';
import { ILike, type Repository } from 'typeorm';
import { ArtistProfile } from './entitites/artist-profile.entity';
import { ArtistSearchQuery } from './dto/artist-search-query.dto';

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
    /**
     * Second repository for the related `ArtistProfile` table. Both
     * repositories share the same underlying `DataSource` / connection
     * pool — TypeORM does NOT create a new connection per repository.
     */
    @InjectRepository(ArtistProfile)
    private readonly artistProfileRepository: Repository<ArtistProfile>,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Returns every artist with their profile eagerly loaded.
   *
   * `relations: { profile: true }` issues a LEFT JOIN to `artist_profile`.
   * Without it `artist.profile` would be `undefined` and accessing fields on
   * it would throw at runtime.
   *
   * Note: we return the Repository's Promise directly — no need to mark the
   * method `async` for a one-liner pass-through. In a real app you would
   * add pagination (`take`/`skip`) here.
   */
  // getAllArtists(): Promise<Artist[]> {
  //   return this.artistRepository.find({
  //     relations: {
  //       profile: true,
  //     },
  //   });
  // }

  getArtists({
    q,
    genre,
    sortBy,
    sortDirection,
    page,
    pageSize,
  }: ArtistSearchQuery): Promise<Artist[]> {
    let where = {};

    if (q) {
      where = {
        name: ILike(`%${q}%`),
      };
    }

    if (genre) {
      where = {
        ...where,
        genre,
      };
    }

    const skip = page * pageSize; // 0, 1
    const take = pageSize; // 10, 20

    return this.artistRepository.find({
      where,
      relations: {
        profile: true,
      },
      order: {
        [sortBy]: sortDirection,
      },
      skip,
      take,
    });
  }

  /**
   * Single artist + profile. Throws Nest `NotFoundException` → HTTP 404 via
   * the default exception layer.
   */
  async getArtistById(id: string): Promise<Artist> {
    const artist = await this.artistRepository.findOne({
      where: { id },
      relations: { profile: true },
    });

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }

  /**
   * Two-table create — inserts an `Artist` row, then a related
   * `ArtistProfile` row that links back via the FK column.
   *
   * Steps:
   *   1. Split the DTO: `profile` is a nested object, the rest is the artist.
   *   2. Insert the artist first so its UUID exists.
   *   3. Insert the profile, linking it to the artist via `artistId`.
   *   4. Re-load the artist with `relations: { profile: true }` so the API
   *      response includes the freshly created profile.
   *
   * Caveat: this is NOT transactional. If step 3 fails, you'll have an
   * orphan artist with no profile. For a transactional version, use
   * `dataSource.transaction(async (manager) => { … })` so both inserts
   * commit or roll back together. We keep the simple version here for
   * teaching clarity — see the README's "Transactions" section for the
   * production-grade pattern.
   *
   * Notice how we don't pass `body` directly to `create()` — we destructure
   * `profile` out first so it never reaches the artist insert. This is
   * defense-in-depth on top of `whitelist: true` in `ValidationPipe`: even
   * if a rogue field slipped through, it would never reach the database.
   */
  async createArtist(body: ArtistCreateDto): Promise<Artist> {
    const { profile, ...restOfBody } = body;

    const newArtist = this.artistRepository.create(restOfBody);

    const savedArtist = await this.artistRepository.save(newArtist);

    const newArtistProfile = this.artistProfileRepository.create(profile);

    await this.artistProfileRepository.save({
      ...newArtistProfile,
      artistId: savedArtist.id,
    });

    return this.getArtistById(savedArtist.id);
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
