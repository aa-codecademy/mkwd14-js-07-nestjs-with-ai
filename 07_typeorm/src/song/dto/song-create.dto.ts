/**
 * Body shape for `POST /song`.
 *
 * Highlights for the lesson:
 *   - Validating an array of UUIDs with `@IsUUID('4', { each: true })`
 *   - Combining size + uniqueness constraints on an array
 *   - Using an integer range (`@IsInt` + `@IsPositive` + `@Max`) for duration
 *   - Providing a default value (`isExplicit = false`) that survives because
 *     `ValidationPipe({ transform: true })` instantiates the class
 */
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';

const MILLISECONDS_IN_SECONDS = 60;
const SECONDS_IN_MINUTE = 60;

export class SongCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  /**
   * Array of UUIDs.
   *
   * `@ArrayNotEmpty()` is stricter than `@ArrayMinSize(1)` semantically:
   * it explicitly rejects empty arrays. Pair it with:
   *   - `@ArrayMaxSize(5)` — cap the size
   *   - `@ArrayUnique()`   — no duplicate ids
   *   - `@IsUUID('4', { each: true })` — every item must be a v4 UUID
   *
   * Note the `{ each: true }` modifier — without it the rule would be
   * applied to the array reference itself rather than to each element.
   */
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  featuringArtistsId!: string[];

  /**
   * Integer between 1 second and 5 minutes (300s).
   *
   * `@IsInt()` rejects floats; `@IsPositive()` rejects 0 and negatives.
   * `@Max(...)` here builds the upper bound from named constants so the
   * intent ("max 5 minutes") is visible without computing the magic 300.
   */
  @IsInt()
  @IsPositive()
  @Max(MILLISECONDS_IN_SECONDS * SECONDS_IN_MINUTE * 5)
  durationSeconds!: number;

  /**
   * Optional boolean with a class-level default.
   *
   * The default `= false` only "sticks" when `ValidationPipe` is configured
   * with `transform: true`. Without transformation the request body stays a
   * plain object and class defaults never get applied.
   */
  @IsOptional()
  @IsBoolean()
  isExplicit: boolean = false;

  @IsOptional()
  @IsUUID('4')
  albumId?: string;
}
