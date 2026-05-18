/**
 * Server-side representation of an artist — i.e. the shape we RETURN.
 *
 * It extends `ArtistCreateDto` and adds `id`, because:
 *   - the client cannot send `id` (the server assigns it on create)
 *   - the server response always includes `id`
 *
 * Inheriting from the create DTO instead of duplicating the fields keeps
 * the two shapes in sync automatically.
 */
import { IsUUID } from 'class-validator';
import { ArtistCreateDto } from './artist-create.dto';

export class ArtistDto extends ArtistCreateDto {
  /**
   * `@IsUUID('4')` enforces a v4 UUID (the format `randomUUID()` produces).
   *
   * The validator is here mostly for self-documentation and for any case
   * where the DTO is validated coming back in (e.g. integration tests).
   */
  @IsUUID('4')
  id!: string;
}
