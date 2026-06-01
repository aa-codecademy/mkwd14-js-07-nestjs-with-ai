/**
 * PATCH `/album/:id` payload — every field of `AlbumCreateDto` becomes
 * optional but keeps its validation rules.
 *
 * See the matching `song-update.dto.ts` / `artist-update.dto.ts` comments
 * for the full explanation of `PartialType`.
 */
import { PartialType } from '@nestjs/mapped-types';
import { AlbumCreateDto } from './album-create.dto';

export class AlbumUpdateDto extends PartialType(AlbumCreateDto) {}
