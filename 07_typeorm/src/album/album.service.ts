/**
 * Album service — all album persistence goes through here.
 *
 * The class is a thin wrapper around `Repository<Album>`. The Repository is
 * TypeORM's high-level API for one entity; it has methods for the 90% of
 * day-to-day operations (find / save / update / delete) so you rarely need to
 * write raw SQL.
 *
 * Full Repository API reference:
 *   https://typeorm.io/repository-api
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { AlbumCreateDto } from './dto/album-create.dto';
import { AlbumUpdateDto } from './dto/album-update.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Album } from './album.entity';
import type { Repository } from 'typeorm';

@Injectable()
export class AlbumService {
  constructor(
    /**
     * `@InjectRepository(Album)` is Nest's bridge between TypeORM and the
     * DI container. It fetches the `Repository<Album>` instance that was
     * registered by `TypeOrmModule.forFeature([Album])` inside this module.
     *
     * `private readonly` is Nest's idiomatic constructor injection — the
     * field is created and assigned automatically by TypeScript.
     */
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}

  /**
   * Create + persist pattern (preferred for inserts):
   *
   *   1. `repository.create(plainObject)` builds an entity INSTANCE in memory.
   *      It does NOT touch the database. It also fills in defaults declared on
   *      the entity, runs `@BeforeInsert` hooks, etc.
   *   2. `repository.save(entity)` runs the actual SQL `INSERT` (or `UPDATE`
   *      if the entity already has a primary key).
   *
   * `save` is "smart": it issues an INSERT for new rows and an UPDATE for
   * existing ones. Use `repository.insert(...)` only when you specifically
   * want INSERT semantics and don't need the saved instance back.
   */
  async create(body: AlbumCreateDto): Promise<Album> {
    const newAlbum = this.albumRepository.create(body);

    const createdAlbum = await this.albumRepository.save(newAlbum);

    return createdAlbum;
  }

  /**
   * `find()` with no arguments returns ALL rows — fine for a small demo,
   * but in production you should always paginate (`.find({ take, skip })`)
   * or use `.findAndCount()` to also get a total. Soft-deleted rows are
   * automatically excluded thanks to `@DeleteDateColumn`.
   */
  findAll(): Promise<Album[]> {
    return this.albumRepository.find();
  }

  /**
   * `findOneBy({ id })` returns `null` when nothing matches (older TypeORM
   * versions returned `undefined`). We translate that into Nest's
   * `NotFoundException`, which the framework turns into an HTTP 404 with a
   * structured error body.
   *
   * Alternatives you'll see in the wild:
   *   - `findOne({ where: { id } })`              same thing, verbose form
   *   - `findOneOrFail({ where: { id } })`        throws `EntityNotFoundError`
   */
  async findOne(id: string): Promise<Album> {
    const album = await this.albumRepository.findOneBy({ id });

    if (!album) {
      throw new NotFoundException(`Album with id ${id} not found`);
    }

    return album;
  }

  /**
   * "Spread merge" update pattern:
   *   - load the existing entity
   *   - spread the partial DTO over it
   *   - hand the merged object to `save()`, which detects the PK and UPDATEs.
   *
   * Equivalent shorter alternative: `repository.update(id, body)`. Difference:
   *   - `save({...})`  → runs entity lifecycle subscribers and returns the
   *                       full updated entity.
   *   - `update(id, …)` → fires a raw `UPDATE ... WHERE id = ?`, no hooks, and
   *                       only tells you how many rows changed.
   */
  async update(id: string, body: AlbumUpdateDto): Promise<Album> {
    const album = await this.findOne(id);

    const updatedAlbum = await this.albumRepository.save({
      ...album,
      ...body,
    });

    return updatedAlbum;
  }

  /**
   * `softDelete` sets `deletedAt = NOW()` instead of issuing a SQL DELETE.
   * Works because the entity has `@DeleteDateColumn`.
   *
   * Counterpart APIs:
   *   - `restore(id)` → unset `deletedAt`, bringing a row back
   *   - `delete(id)`  → hard DELETE (irreversible)
   */
  async remove(id: string): Promise<void> {
    await this.albumRepository.softDelete(id);
  }
}
