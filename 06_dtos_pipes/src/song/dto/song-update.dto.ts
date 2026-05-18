import { PartialType } from '@nestjs/mapped-types';
import { SongCreateDto } from './song-create.dto';

export class SongUpdateDto extends PartialType(SongCreateDto) {}
