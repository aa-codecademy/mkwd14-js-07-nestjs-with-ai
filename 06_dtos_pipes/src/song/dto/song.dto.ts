/**
 * Server-side representation of a song.
 *
 * Same pattern as `ArtistDto`: extend the create DTO and add the
 * server-assigned `id`. This avoids duplicating field definitions and keeps
 * the create / response shapes in sync.
 */
import { IsUUID } from 'class-validator';
import { SongCreateDto } from './song-create.dto';

export class SongDto extends SongCreateDto {
  @IsUUID('4')
  id!: string;
}
