import { PartialType } from '@nestjs/mapped-types';
import { AlbumCreateDto } from './album-create.dto';

export class AlbumUpdateDto extends PartialType(AlbumCreateDto) {}
