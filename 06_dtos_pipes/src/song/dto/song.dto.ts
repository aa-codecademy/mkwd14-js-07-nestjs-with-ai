import { IsUUID } from 'class-validator';
import { SongCreateDto } from './song-create.dto';

export class SongDto extends SongCreateDto {
  @IsUUID('4')
  id!: string;
}
