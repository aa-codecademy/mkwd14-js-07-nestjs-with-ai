/**
 * JwtPayload — the data we embed inside a signed JWT token.
 *
 * A JWT has three parts: header.payload.signature
 * The PAYLOAD section is a JSON object — not encrypted, just base64-encoded —
 * so NEVER put secrets (passwords, credit cards) in here. Anyone can decode it
 * with jwt.io. The SIGNATURE is what proves the token was issued by US and
 * hasn't been tampered with.
 *
 * Why these two fields?
 *
 *   sub ("subject") — the RFC 7519 standard claim for "who this token is about".
 *   Using the user's UUID here lets us verify identity without a DB round-trip
 *   on every request. We store the id (not email) because ids are stable;
 *   users can change their email.
 *
 *   username — we include the email as a convenience claim so the strategy
 *   can look up the user from the DB (to check the account still exists) without
 *   needing a second query by id.
 *
 * Keep the payload small! Every HTTP request carries the token in the
 * Authorization header, so every byte here is sent on the wire on each call.
 */
export interface JwtPayload {
  sub: string; // User UUID — standard JWT "subject" claim
  username: string; // User email — used by JwtStrategy.validate to reload the user
}
