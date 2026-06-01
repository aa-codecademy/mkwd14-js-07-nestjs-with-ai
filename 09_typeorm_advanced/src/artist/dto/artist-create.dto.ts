/**
 * Body shape for `POST /artist`.
 *
 * This DTO is the canonical example for the lesson:
 *   - simple string / number / boolean validators
 *   - allowed-value list via `@IsIn`
 *   - optional fields with `@IsOptional`
 *   - array validation (size, uniqueness, per-item rules)
 *   - nested object validation with `@ValidateNested` + `@Type`
 *
 * Reminder: this MUST be a class (not an interface). TypeScript interfaces
 * are erased at compile time; decorators only survive on real classes, and
 * `class-validator` reads them at runtime.
 */
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Genre } from '../../common/types/genre';

/**
 * Nested DTO used as the type of `ArtistCreateDto.profile`.
 *
 * For nested validation to work the parent class MUST use BOTH:
 *   - `@ValidateNested()` — tells class-validator to recurse into the field
 *   - `@Type(() => ArtistProfileDto)` — tells class-transformer the runtime
 *     class to instantiate (TS types are gone after compilation)
 *
 * Without `@Type`, the inner object stays as a plain `{}` and inner
 * decorators are skipped.
 */
class ArtistProfileDto {
  @IsString()
  @Length(2, 60)
  country!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsEmail()
  bookingEmail?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;
}

export class ArtistCreateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsEnum(Genre)
  genre!: Genre;

  @IsBoolean()
  isActive!: boolean;

  @ValidateNested()
  @Type(() => ArtistProfileDto)
  profile!: ArtistProfileDto;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  aliases?: string[];
}
