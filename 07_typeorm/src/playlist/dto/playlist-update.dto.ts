import { PartialType } from '@nestjs/mapped-types';
import { PlaylistCreateDto } from './playlist-create.dto';

export class PlaylistUpdateDto extends PartialType(PlaylistCreateDto) {}
