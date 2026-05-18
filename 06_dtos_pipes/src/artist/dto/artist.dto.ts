import { IsUUID } from 'class-validator';
import { ArtistCreateDto } from './artist-create.dto';

export class ArtistDto extends ArtistCreateDto {
  @IsUUID('4')
  id!: string;
}
