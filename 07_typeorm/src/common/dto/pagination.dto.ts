/**
 * Reusable pagination DTO.
 *
 * Designed to be EXTENDED by per-feature search DTOs (e.g.
 * `ArtistSearchQuery extends PaginationDto`). Doing it this way:
 *   - Keeps validation rules for `page` / `pageSize` in one place.
 *   - Lets every list endpoint share the same pagination contract.
 *   - Inheritance + `class-validator` is fully supported — decorators on
 *     parent properties are picked up automatically on subclasses.
 *
 * Class-field defaults (`= 1`, `= 10`) provide the values when the client
 * omits the query parameters, since `@IsOptional()` skips validation but
 * leaves the field as `undefined`. With our global `ValidationPipe`
 * configured with `transform: true`, these defaults survive into the
 * controller as real numbers.
 *
 * Why `@IsPositive()` instead of `@Min(1)`? Either works — `@IsPositive()`
 * rejects 0 and negatives in one decorator. We avoid `0` because TypeORM's
 * `skip: 0` is the legitimate first page, but `pageSize: 0` would return
 * an empty array — a footgun for clients.
 */
import { IsInt, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  page: number = 1;

  @IsOptional()
  @IsInt()
  @IsPositive()
  pageSize: number = 10;
}
