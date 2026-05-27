/**
 * DTO for `PUT /playlist/:id/songs`.
 *
 * Carries the full desired set of song UUIDs for the playlist. Matches the
 * "set-replace" semantics implemented by `PlaylistService.addSongs`.
 *
 * The commented-out alternative at the bottom shows what you'd write for a
 * `PATCH`-style endpoint that takes a delta (`add` + `remove`) instead of a
 * complete list. Either is a valid REST design; this lesson picks `PUT`
 * because it's the simpler model to reason about.
 */
import { IsArray, IsUUID } from 'class-validator';

export class PlaylistUpdateSongs {
  /**
   * `@IsArray()` ensures the value is an array. `@IsUUID('4', { each: true })`
   * runs the UUID v4 check on EVERY element — `each: true` is the magic
   * modifier from `class-validator` that turns a scalar validator into an
   * array-element validator.
   */
  @IsArray()
  @IsUUID('4', { each: true })
  songIds!: string[];
}

// export class PlaylistUpdateSongs {
//   @IsOptional()
//   @IsUUID('4', { each: true })
//   songIdsToAdd?: string[];

//   @IsOptional()
//   @IsUUID('4', { each: true })
//   songIdsToRemove?: string[];
// }
