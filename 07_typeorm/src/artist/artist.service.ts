/**
 * Domain logic for artists: in-memory storage for learning (replace with a database later).
 *
 * `@Inject(ARTIST_ID_GENERATOR)` receives the factory-created ID function from `AppModule`
 * instead of hard-coding `Date.now()` here — easier to mock in tests or swap strategies.
 *
 * Important architecture choice:
 * - This service no longer depends on SongService.
 * - Keeping dependencies one-directional (Song -> Artist) avoids circular references.
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
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    private readonly logger: LoggerService,
  ) {}

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

  async deleteArtist(id: string): Promise<void> {
    await this.artistRepository.softDelete(id);
  }
}
