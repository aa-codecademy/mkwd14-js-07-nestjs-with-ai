/**
 * Update DTOs for artists.
 *
 * Two update flavors are demonstrated here:
 *
 *   - `ArtistPartialUpdateDto` (PATCH semantics)
 *       Every field optional. Built by deriving from `ArtistCreateDto` with
 *       `PartialType()` so we DON'T have to copy the decorators by hand.
 *
 *   - `ArtistUpdateDto` (PUT semantics, currently unused — see the commented
 *       handler in `artist.controller.ts`)
 *       Full replacement: required fields must always be sent.
 *
 * Helpers from `@nestjs/mapped-types` you can use the same way:
 *   - PartialType(X)      — every field becomes optional
 *   - PickType(X, [...])  — keep only the listed fields
 *   - OmitType(X, [...])  — drop the listed fields
 *   - IntersectionType(A, B) — merge two DTOs
 *
 * They all preserve the existing validation decorators, which is exactly
 * what keeps your validation rules DRY.
 */
import { PartialType } from '@nestjs/mapped-types';
import { ArtistCreateDto } from './artist-create.dto';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

/**
 * PATCH `/artist/:id` — accepts any subset of `ArtistCreateDto` fields.
 *
 * Behind the scenes `PartialType` returns a NEW class where each field is
 * marked with `@IsOptional()` (and made `?` in the TS type) while keeping
 * the original validators (`@IsString`, `@Length`, …) intact.
 */
export class ArtistPartialUpdateDto extends PartialType(ArtistCreateDto) {}

/**
 * PUT `/artist/:id` — full replacement.
 *
 * Note this class is hand-written (not derived) to illustrate the
 * "everything required" alternative. In real projects you would usually
 * just reuse the create DTO instead.
 */
export class ArtistUpdateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @IsIn(['rock', 'pop', 'jazz', 'hip-hop', 'classical', 'electronic'])
  genre!: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;
}
