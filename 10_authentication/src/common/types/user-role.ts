/**
 * UserRole — the set of roles a user account can have.
 *
 * WHY AN ENUM INSTEAD OF PLAIN STRINGS?
 *   - TypeScript enforces the valid values at compile time. You can't
 *     accidentally pass 'superadmin' or 'moder' where a UserRole is expected.
 *   - The values are defined in ONE place. If you rename a role, the compiler
 *     finds every usage instantly.
 *   - TypeORM maps the enum to a native Postgres ENUM type in the database,
 *     so invalid roles are also rejected at the database level.
 *
 * HOW ROLES ARE USED:
 *   - Stored on the User entity:  role: UserRole  (default: UserRole.USER)
 *   - Carried in req.user:         { id, username, role }  (set by JwtStrategy)
 *   - Checked by RolesGuard:       requiredRoles.includes(user.role)
 *   - Declared on endpoints:       @Roles(UserRole.ADMIN)
 *
 * ROLE PERMISSIONS IN THIS APP:
 *   USER  → read artists/songs/albums, create/edit their own playlists
 *   ADMIN → everything USER can do, plus create/delete artists/songs/albums/playlists
 *
 * To give a user admin access, update their row in the database:
 *   UPDATE "user" SET role = 'admin' WHERE email = 'admin@music.com';
 *
 * In a production system you would build an admin promotion endpoint instead
 * of direct database edits, and protect it with a separate super-admin role.
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}
