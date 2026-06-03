/**
 * Sort direction enum used by list / search endpoints.
 *
 * The string values match the SQL keywords (`ASC` / `DESC`), so the value
 * we receive from the query string can be handed DIRECTLY to TypeORM's
 * `order: { field: sortDirection }` option without any mapping.
 *
 * Using an enum (instead of a `string`) gives us:
 *   - DB-safe values — `@IsEnum(SortDirection)` rejects `"sideways"`.
 *   - Auto-complete + refactor support in TypeScript.
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
