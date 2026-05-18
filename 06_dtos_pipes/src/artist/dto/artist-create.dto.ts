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

  /**
   * `@IsEmail()` validates RFC-compliant email format.
   * It is paired with `@IsOptional()` so empty / missing values are accepted.
   */
  @IsOptional()
  @IsEmail()
  bookingEmail?: string;

  /**
   * `require_protocol: true` rejects URLs like `"example.com"` and accepts
   * only `"https://example.com"`. Helpful when the URL is shown as a link.
   */
  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;
}

export class ArtistCreateDto {
  /**
   * Two validators on one field — both must pass.
   *   - `@IsString()` rejects numbers, booleans, objects, etc.
   *   - `@Length(1, 120)` enforces a min/max character count.
   *
   * The `!` after the field name is a TS "definite assignment" assertion;
   * it has nothing to do with validation and only silences the strict
   * "property is not initialized" compiler error.
   */
  @IsString()
  @Length(1, 120)
  name!: string;

  /**
   * `@IsIn([...])` constrains the value to a fixed allow-list (enum-like).
   * If you have a TS enum you can pass `Object.values(MyEnum)` instead.
   */
  @IsString()
  @IsIn(['rock', 'pop', 'jazz', 'hip-hop', 'classical', 'electronic'])
  genre!: string;

  @IsBoolean()
  isActive!: boolean;

  /**
   * Nested object — see comment on `ArtistProfileDto` for why both
   * decorators are required together.
   */
  @ValidateNested()
  @Type(() => ArtistProfileDto)
  profile!: ArtistProfileDto;

  /**
   * Optional integer in a range.
   *
   * `@IsOptional()` MUST come first: when the value is `undefined` or `null`
   * all later validators are skipped. Without it, missing `debutYear` would
   * fail `@IsInt()`.
   *
   * `@Max(new Date().getFullYear())` rejects future years.
   */
  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;

  /**
   * Array validation cheatsheet:
   *   - `@IsArray()`        → the field itself is an array
   *   - `@ArrayMinSize(n)`  → at least n elements
   *   - `@ArrayMaxSize(n)`  → at most n elements
   *   - `@ArrayUnique()`    → no duplicate elements
   *   - `{ each: true }`    → apply the rule to EVERY element
   *
   * Combined here: between 1 and 5 unique strings, each 2–30 chars long.
   */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  aliases?: string[];
}
