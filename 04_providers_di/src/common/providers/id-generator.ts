/**
 * Injection token for “how we mint numeric IDs”.
 * A `Symbol` avoids string collisions and works with `@Inject(ARTIST_ID_GENERATOR)`.
 */
export const ARTIST_ID_GENERATOR = Symbol('ARTIST_ID_GENERATOR');
export type ArtistIdGenerator = () => number;
