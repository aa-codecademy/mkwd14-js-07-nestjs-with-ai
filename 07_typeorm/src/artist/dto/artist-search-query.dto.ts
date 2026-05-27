/**
 * Query DTO for `GET /artist`.
 *
 * Extends `PaginationDto` to inherit `page` + `pageSize` validation. Adds:
 *   - `q`             — optional free-text search on `name` (ILIKE %q%)
 *   - `genre`         — optional exact-match filter
 *   - `sortBy`        — whitelisted column to sort by (enum)
 *   - `sortDirection` — `ASC` or `DESC` (enum)
 *
 * Why an `ArtistSortByFields` ENUM instead of accepting any string?
 *
 *   sortBy=<column>  is a notorious source of SQL injection in hand-rolled
 *   APIs. Even when you use parameterized queries, the column name itself
 *   is interpolated as an identifier and cannot be parameterized.
 *
 *   By constraining the value to a closed enum, we let `class-validator`
 *   reject anything else BEFORE the value reaches TypeORM. This is the
 *   single most important defensive-coding pattern for "sort by user input"
 *   endpoints.
 *
 * Note on defaults: `sortBy` and `sortDirection` have class-field defaults
 * (`createdAt` + `DESC`), so omitted query params fall back to a sensible
 * "newest first" listing.
 */
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Genre } from '../../common/types/genre';
import { SortDirection } from '../../common/types/sort-direction';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ArtistSortByFields {
  debutYear = 'debutYear',
  isActive = 'isActive',
  genre = 'genre',
  name = 'name',
  createdAt = 'createdAt',
}

export class ArtistSearchQuery extends PaginationDto {
  /** Free-text search keyword. `@Length(1, 50)` keeps misuse cheap. */
  @IsOptional()
  @IsString()
  @Length(1, 50)
  q?: string;

  /** Exact-match filter on the `genre` enum column. */
  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  /** Whitelist of sortable columns. See class doc-comment for rationale. */
  @IsOptional()
  @IsEnum(ArtistSortByFields)
  sortBy: ArtistSortByFields = ArtistSortByFields.createdAt;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;
}
