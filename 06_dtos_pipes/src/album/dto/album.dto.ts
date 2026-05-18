import { IsUUID } from 'class-validator';
import { AlbumCreateDto } from './album-create.dto';

export class AlbumDto extends AlbumCreateDto {
  @IsUUID('4')
  id!: string;
}
