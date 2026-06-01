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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({
    example: 'USA',
  })
  country!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  @ApiPropertyOptional({
    example: 'Los Angeles',
  })
  city?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    example: 'drake@yahoo.com',
  })
  bookingEmail?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @ApiPropertyOptional({
    example: 'https://drake.net',
  })
  website?: string;
}

export class ArtistCreateDto {
  @IsString()
  @Length(1, 120)
  @ApiProperty({
    example: 'Drake',
    minLength: 1,
    maxLength: 120,
  })
  name!: string;

  @IsEnum(Genre)
  @ApiProperty({
    enum: Genre,
    example: Genre.hipHop,
  })
  genre!: Genre;

  @IsBoolean()
  @ApiProperty()
  isActive!: boolean;

  @ValidateNested()
  @Type(() => ArtistProfileDto)
  @ApiProperty({
    type: ArtistProfileDto,
  })
  profile!: ArtistProfileDto;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  @ApiPropertyOptional({
    example: 2000,
  })
  debutYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ['Drake'],
    minItems: 1,
    maxItems: 5,
    uniqueItems: true,
  })
  aliases?: string[];
}
