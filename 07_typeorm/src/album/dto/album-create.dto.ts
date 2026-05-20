/**
 * Body shape for `POST /album`.
 *
 * This DTO is the best example in the lesson for two transformation cases
 * that confuse students at first:
 *
 *   1. Parsing a JSON string into a real `Date` object via `@Type(() => Date)`.
 *   2. Validating an ARRAY of NESTED OBJECTS with
 *      `@ValidateNested({ each: true })` + `@Type(() => Child)`.
 *
 * Remember: TypeScript types disappear at runtime. `class-transformer` only
 * knows about a non-primitive type if you give it the `@Type(() => Class)`
 * hint.
 */
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

/**
 * Nested child DTO — describes one physical edition of an album
 * (vinyl, CD, limited-collector edition, etc.).
 *
 * Used as the element type of `AlbumCreateDto.editions[]`.
 */
class AlbumEditionDto {
  @IsString()
  @Length(2, 40)
  format!: string;

  @IsInt()
  @IsPositive()
  copies!: number;

  @IsBoolean()
  isLimited!: boolean;
}

export class AlbumCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsUUID('4')
  artistId!: string;

  /**
   * Optional date field.
   *
   * Two-step processing:
   *   1. `@Type(() => Date)` tells class-transformer to call `new Date(value)`
   *      on the incoming JSON string. ISO 8601 strings like
   *      `"2024-09-15T00:00:00.000Z"` are converted into real `Date` objects.
   *   2. `@IsDate()` then asserts the result really is a Date.
   *
   * Without `@Type` the field stays a plain string and `@IsDate()` always
   * fails — a very common source of confusion.
   */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  /**
   * Array of nested objects — the trickiest case to validate correctly.
   *
   * What each decorator does here:
   *   - `@IsArray()`                       — field is an array
   *   - `@ArrayNotEmpty()`                 — at least one element
   *   - `@Type(() => AlbumEditionDto)`     — instantiate each element as
   *                                          an `AlbumEditionDto`
   *   - `@ValidateNested({ each: true })`  — run the child decorators on
   *                                          every element
   *
   * Drop any of them and validation silently becomes weaker — e.g. removing
   * `{ each: true }` would only check the array as a whole, not its items.
   */
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => AlbumEditionDto)
  @ValidateNested({ each: true })
  editions!: AlbumEditionDto[];
}
