/**
 * PATCH `/song/:id` payload.
 *
 * `PartialType(SongCreateDto)` returns a derived class where every field is
 * optional but every validation decorator from the create DTO is preserved.
 *
 * Why this matters: a PATCH endpoint should accept any subset of fields
 * without forcing the client to send the full object, yet we still want
 * each field that IS sent to be validated.
 */
import { PartialType } from '@nestjs/mapped-types';
import { SongCreateDto } from './song-create.dto';

export class SongUpdateDto extends PartialType(SongCreateDto) {}
