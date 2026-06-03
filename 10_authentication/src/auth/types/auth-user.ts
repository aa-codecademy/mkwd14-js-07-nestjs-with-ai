/**
 * AuthUser — the minimal user object that Passport attaches to every
 * authenticated request as `request.user`.
 *
 * After a JWT token is verified, JwtStrategy.validate() returns an object.
 * Passport takes that return value and assigns it to `req.user`.
 * In a NestJS controller you can then access it via @Req() req or
 * the dedicated @User() custom parameter decorator pattern.
 *
 * Why not use the full User entity here?
 *   The full User entity comes from the database (id, email, createdAt, …).
 *   Loading the entire entity on every single authenticated request is wasteful.
 *   AuthUser intentionally contains only the fields controllers actually need:
 *     - id  → to scope DB queries to "this user's data"
 *     - username (email) → for display or audit logging
 *
 * This is sometimes called the "principal" or "security context" object in
 * other frameworks (Spring Security, ASP.NET, etc.).
 */
export interface AuthUser {
  id: string; // UUID of the authenticated user
  username: string; // Email of the authenticated user
}
