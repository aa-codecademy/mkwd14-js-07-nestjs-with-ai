/**
 * Server-side representation of an album.
 *
 * Same pattern as `ArtistDto` / `SongDto`: extends the create DTO with the
 * server-assigned `id` so we don't repeat field definitions.
 */
import { IsUUID } from 'class-validator';
import { AlbumCreateDto } from './album-create.dto';

export class AlbumDto extends AlbumCreateDto {
  @IsUUID('4')
  id!: string;
}
