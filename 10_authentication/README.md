# NestJS — Authentication & Authorization with JWT (SEDC)

This lesson adds **stateless JWT authentication** and **role-based authorization** on top of the TypeORM project from the previous lesson. You will learn how to protect endpoints so that only logged-in users can access them, and how to further restrict endpoints based on user roles.

You will learn:

- What **authentication** is and how it differs from **authorization**
- Why we never store plain-text passwords (and what **bcrypt** does instead)
- What a **JWT** is, what it contains, and why it is self-verifying
- How **Passport.js** and **strategies** work in NestJS
- How **Guards** intercept requests before controllers run
- The full **registration → login → protected request** cycle
- How **refresh tokens** extend sessions without re-logging-in
- How **Role-Based Access Control (RBAC)** restricts endpoints by user role
- How to protect individual resources with **ownership guards**
- Common security mistakes and why the code avoids them
- Where to store tokens in the browser and why the storage location matters
- How to implement **automatic silent token refresh** on the client side
- How to prevent duplicate refresh requests when multiple calls fail concurrently
- How to persist sessions across page reloads using `localStorage`
- How to client-side decode a JWT payload for display (without trusting it for security)

> The TypeORM, relations, pagination, and filtering knowledge from the previous lesson is still in this project. This README focuses purely on the authentication and authorization layers.

---

## 0. Runtime map for this project

- API prefix: `app.setGlobalPrefix('api')` → all REST endpoints are under `/api/*`
- Swagger UI: `/docs` (includes an "Authorize" button to paste your JWT)
- Raw OpenAPI JSON: `/docs-json`
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`
- All endpoints are **protected by default** — see section 7 on the global guard pattern

### Environment variables (see `.env.example`)

```env
JWT_SECRET=ultra-large-secret-key-that-should-be-kept-safe-and-not-shared-with-anyone
JWT_EXPIRES_IN=60s
JWT_REFRESH_SECRET=a-different-long-random-secret-for-refresh-tokens
JWT_REFRESH_EXPIRES_IN=3m
```

`JWT_SECRET` is the HMAC key used to sign and verify access tokens. `JWT_REFRESH_SECRET` is a **separate** key used only for refresh tokens. Both must be long random strings and must **never** be committed to git.

---

## 1. Authentication vs Authorization

These two words are often confused. They mean different things:

| Term               | Question                      | Example                                              |
|--------------------|-------------------------------|------------------------------------------------------|
| **Authentication** | *Who are you?*                | Is this a valid, logged-in user?                     |
| **Authorization**  | *What are you allowed to do?* | Is this user an admin? Can they edit this resource?  |

This lesson covers **both**:

- Authentication is handled by `JwtAuthGuard` + `JwtStrategy` (JWT validation)
- Role authorization is handled by `RolesGuard` + `@Roles()` decorator
- Resource-level authorization is handled by `PlaylistOwnershipGuard`

---

## 2. Why we never store plain-text passwords

Imagine your database is leaked (it happens — even to large companies). If you stored passwords as plain text, every user's password would be immediately exposed. If they reuse that password on their bank, email, or social media, attackers now own those accounts too.

**The solution: one-way hashing.**

A hash function takes an input and produces a fixed-size output. There is no way to reverse the hash back to the original input (without brute force). When a user logs in, you hash their candidate password with the same algorithm and compare the two hashes — you never need the original.

### Why bcrypt specifically?

Not all hash functions are equal for passwords. MD5 and SHA-256 are designed to be **fast** — a GPU can compute billions per second, making brute-force attacks trivial.

**bcrypt** is deliberately **slow**. It has a "cost factor" (the second argument to `bcrypt.hash`) that controls how many rounds of computation it performs:

```text
Cost 10 ≈ ~100ms per hash on modern hardware
Cost 12 ≈ ~400ms
Cost 14 ≈ ~1600ms
```

At cost 10, an attacker trying 1 billion passwords per second on a GPU is slowed to roughly 10 per second. bcrypt also generates a random **salt** per hash automatically, so two users with the same password get completely different hashes — rainbow table attacks don't work.

See `src/user/user.service.ts` → `createUser` method for the implementation.

---

## 3. What is a JWT?

A **JSON Web Token** (JWT) is a compact, URL-safe string that represents a set of claims. It looks like this:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MmQyNWQiLCJ1c2VybmFtZSI6InVzZXJAbXVzaWMuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDAwNjB9.V5KCE_1Bnz8sVqmAQx7w9EgFjW0YdqKP_cXwPKt3UxM
```

Three parts separated by `.`:

```text
HEADER.PAYLOAD.SIGNATURE
```

### 3.1 Header

```json
{ "alg": "HS256", "typ": "JWT" }
```

Declares the signing algorithm. HS256 = HMAC-SHA256 (symmetric — same key to sign and verify).

### 3.2 Payload

```json
{
  "sub": "42d25d8c-4f83-11ee-be56-0242ac120002",
  "username": "user@music.com",
  "iat": 1700000000,
  "exp": 1700000060
}
```

Contains the **claims** — facts about the user. `iat` (issued-at) and `exp` (expiry) are added automatically by the JWT library. `sub` is the RFC 7519 standard name for "the subject of this token" — we store the user's UUID there.

> **The payload is NOT encrypted — it is only base64-encoded.** Anyone with the token can decode and read it at [jwt.io](https://jwt.io). Never put passwords, secrets, or sensitive data in the payload.

### 3.3 Signature

```text
HMACSHA256(
  base64url(header) + "." + base64url(payload),
  JWT_SECRET
)
```

The signature proves two things:

1. The token was issued by the server (only the server knows `JWT_SECRET`).
2. The payload has not been tampered with (changing even one character invalidates the signature).

### 3.4 Why JWTs are "stateless"

Traditional session-based auth stores a session ID in a database. On every request the server looks up the session, which requires a DB query.

JWTs are **self-verifying** — the server only needs the secret to validate a token. No database lookup required on every request. This scales horizontally: multiple server instances all verify tokens independently with the same secret.

**Trade-off:** JWTs cannot be invalidated before they expire. If a token is stolen, it works until `exp`. Mitigations: short expiry times, token blocklists (giving up some statelessness), or refresh token rotation (implemented in this project).

---

## 4. The full authentication flow

```text
REGISTRATION:
  Client → POST /api/auth/register { email, password }
    → ValidationPipe validates RegisterDto (format, strength)
    → AuthController.register()
    → AuthService.register()
    → UserService.createUser()
      → normalize email to lowercase
      → check for existing user (409 Conflict if duplicate)
      → bcrypt.hash(password, 10)  ← plain password destroyed after this
      → INSERT INTO "user" (email, passwordHash)
    ← return saved User (without passwordHash — { select: false })

LOGIN:
  Client → POST /api/auth/login { email, password }
    → ValidationPipe validates LoginDto
    → AuthController.login()
    → AuthService.login()
      → UserService.getUserByEmail(email)  ← throws if not found
      → UserService.verifyPassword(credentials)
          → QueryBuilder with .addSelect('passwordHash')  ← opt-in excluded column
          → bcrypt.compare(inputPassword, storedHash)
      → build JwtPayload { sub: user.id, username: user.email }
      → jwtService.signAsync(payload, { secret: JWT_SECRET, expiresIn })     ← access token
      → jwtService.signAsync(payload, { secret: JWT_REFRESH_SECRET, expiresIn }) ← refresh token
      → bcrypt.hash(refreshToken) → save hash + expiry in DB
    ← return { user, accessToken, refreshToken }

PROTECTED REQUEST:
  Client → GET /api/playlist  Authorization: Bearer eyJ...
    → JwtAuthGuard.canActivate()
    → AuthGuard('jwt') triggers JwtStrategy
      → ExtractJwt.fromAuthHeaderAsBearerToken()  ← reads the header
      → verify signature with JWT_SECRET
      → check exp (token not expired)
      → JwtStrategy.validate(payload)
          → UserService.getUserByEmail(payload.username)
          → return AuthUser { id, username, role }
      → attach AuthUser to req.user
    → RolesGuard checks @Roles() metadata against req.user.role
    → controller method runs with req.user available

REFRESH TOKENS:
  Client → POST /api/auth/refresh { userId, refreshToken }
    → AuthService.refresh()
      → UserService.getUserByRefreshToken(userId, refreshToken)
          → load user with hidden refreshTokenHash + refreshTokenExpiry columns
          → check expiry < now (expired? throw)
          → bcrypt.compare(incomingToken, storedHash) (invalid? throw)
      → issue new accessToken (signed with JWT_SECRET)
      → issue new refreshToken (signed with JWT_REFRESH_SECRET)
      → overwrite stored refresh token hash in DB (old token now invalid)
    ← return { user, accessToken, refreshToken }
```

---

## 5. Refresh tokens explained

When a short-lived access token expires (60s in dev, 15m in production), the user would normally have to log in again. Refresh tokens solve this problem gracefully.

**Two tokens, two jobs:**

| Token         | Lifetime            | Sent on            | Signed with          |
|---------------|---------------------|--------------------|----------------------|
| Access token  | Short (60s–15m)     | Every API request  | `JWT_SECRET`         |
| Refresh token | Long (minutes–days) | Only to `/refresh` | `JWT_REFRESH_SECRET` |

Using different secrets means the two token types cannot be substituted for each other — a refresh token cannot authenticate an API call, and an access token cannot be used to refresh.

**Refresh token rotation:**

Every time the client uses a refresh token, it receives a brand-new refresh token (and a new access token). The old refresh token is immediately invalidated. This means:

- A stolen refresh token can only be used **once** before it is superseded.
- If both the attacker and the real user try to use the same token, only the first call succeeds — a detectable signal of compromise.

**Storage security:**

Refresh tokens are stored as **bcrypt hashes** in the database (same principle as passwords). If the database is compromised, raw refresh tokens cannot be extracted.

See `src/auth/dto/refresh.dto.ts`, `src/auth/auth.service.ts`, and `src/user/user.service.ts` for the implementation.

---

## 5a. Client-side token management

The server handles issuing and validating tokens. The client (browser) is responsible for storing them securely, restoring sessions after a page reload, and refreshing them automatically when they expire. This section explains every decision in `public/app.js`.

### Where to store tokens

Four options exist in a browser:

| Storage               | Readable by JS  | Survives reload | Suitable for                         |
|-----------------------|-----------------|-----------------|--------------------------------------|
| **Memory (variable)** | Same page only  | No              | Access token (ideal)                 |
| **`localStorage`**    | Any script      | Yes             | Refresh token (acceptable for demos) |
| **`sessionStorage`**  | Same tab only   | No (tab close)  | Short-lived data                     |
| **`httpOnly` cookie** | Server only     | Yes             | Refresh token (ideal in production)  |

**Access token → memory.**  
The access token lives in the `state` JavaScript object. It is never written to disk. An attacker who can inject a `<script>` tag (XSS) can read `state.accessToken` — but only while the page is open, and only until the token expires (2 minutes in this demo). Nothing survives a page reload.

**Refresh token → `localStorage`.**  
`localStorage` persists across page reloads, so the user does not have to log in on every visit. The tradeoff: any JavaScript on the page can call `localStorage.getItem()`. A malicious script from a compromised npm package or a browser extension could steal it.

**The ideal production setup: `httpOnly` cookie.**  
If the server sends the refresh token as an `httpOnly` cookie (`Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict`), JavaScript cannot read it at all — not even your own code. The browser attaches it automatically on requests to the same origin. This completely eliminates the XSS theft vector for the refresh token. Implementing this requires a backend change; this demo returns tokens in the JSON body for simplicity.

### Persisting the session (`persistSession` / `restoreSession`)

On every login or refresh, `persistSession()` writes the current session to `localStorage`:

```javascript
localStorage.setItem(STORAGE_KEY, JSON.stringify({
  accessToken: state.accessToken,
  refreshToken: state.refreshToken,
  userId: state.userId,
  userEmail: state.userEmail,
  userRole: state.userRole,
}));
```

On page load, `restoreSession()` reads it back:

```javascript
const { accessToken, refreshToken, userId, ... } = JSON.parse(raw);
state.accessToken = accessToken ?? null;
state.refreshToken = refreshToken;
// ...
```

If the stored access token is still valid, the first API call succeeds immediately. If it has already expired, the API call gets a `401` and the auto-refresh kicks in transparently.

On logout or session failure, `clearSession()` calls `localStorage.removeItem(STORAGE_KEY)` so no stale data lingers.

### Automatic silent refresh (the 401 retry pattern)

The `api()` helper intercepts every `401 Unauthorized` response. Instead of showing an error, it:

1. Calls `silentRefresh()` — sends `POST /api/auth/refresh` in the background.
2. Updates `state.accessToken` and `state.refreshToken` with the new pair.
3. Retries the original request **once** with the new access token.
4. If the refresh itself fails (e.g. the refresh token is also expired or revoked), calls `clearSession()` and propagates a `401` error to the caller.

```javascript
if (res.status === 401 && !_retry) {
  try {
    await silentRefresh();
    return api(path, options, true);   // retry once
  } catch {
    clearSession();
    throw new ApiError(401, 'Session expired — please log in again.');
  }
}
```

The `_retry` flag is critical: it prevents an infinite loop if the retry also returns `401`. Without it, `api()` would keep calling itself forever.

### Deduplicating concurrent refresh requests

Imagine the page fires three API calls simultaneously (artists, songs, albums). If the access token is expired, all three get `401` at the same time and all three try to call `silentRefresh()`. Only the first refresh call will succeed — the server uses **rotation**, so the second call receives the already-replaced refresh token and fails.

The fix is a shared in-flight Promise:

```javascript
let _refreshInFlight = null;

async function silentRefresh() {
  if (_refreshInFlight) return _refreshInFlight;   // join the in-flight request

  _refreshInFlight = (async () => {
    // ... do the actual refresh ...
  })().finally(() => { _refreshInFlight = null; }); // clear when done

  return _refreshInFlight;
}
```

The first caller creates the Promise and stores it in `_refreshInFlight`. Every subsequent concurrent caller receives the **same Promise** and waits for it. Only one HTTP request is ever sent. When it resolves, all callers proceed with the new token and retry their original requests.

### Client-side JWT decoding (display only)

A JWT payload is base64-encoded, not encrypted. Anyone with the token string can read its claims without the secret. The client decodes the payload to display the token expiry countdown:

```javascript
function decodeJwt(token) {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(b64));
}

const payload = decodeJwt(state.accessToken);
const secsLeft = payload.exp - Math.floor(Date.now() / 1000);
```

`payload.exp` is a Unix timestamp in seconds. Subtracting the current time gives the seconds until expiry.

**This is used for display only.** Never use a client-decoded JWT payload for access control decisions. The server verifies the signature and expiry on every request — the client cannot forge or extend a token.

---

## 6. Role-Based Access Control (RBAC)

### 6.1 The roles

```typescript
// src/common/types/user-role.ts
export enum UserRole {
  USER  = 'user',   // Default role — can read and manage their own playlists
  ADMIN = 'admin',  // Can also create/delete songs, albums, artists, any playlist
}
```

Every new account is assigned `UserRole.USER` automatically. To promote an account to admin, update the database directly:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'admin@music.com';
```

### 6.2 The @Roles() decorator

```typescript
import { SetMetadata } from '@nestjs/common';

// Attaches a 'roles' metadata array to the route handler.
// RolesGuard reads this metadata to decide who can call the endpoint.
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

Usage:

```typescript
// Only admins can delete playlists:
@Roles(UserRole.ADMIN)
@Delete(':id')
remove() { ... }

// Any authenticated user (user or admin) can create a playlist:
@Roles(UserRole.USER, UserRole.ADMIN)
@Post()
create() { ... }

// No @Roles → any authenticated user is allowed through.
```

### 6.3 RolesGuard

```typescript
// Reads the @Roles() metadata and compares it to req.user.role.
// If no @Roles is set → allow. If set → user's role must be in the list.
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY, [context.getHandler(), context.getClass()]
    );
    if (!requiredRoles?.length) return true; // no restriction
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role); // 403 if not in list
  }
}
```

### 6.4 Endpoint permissions at a glance

| Endpoint                        | USER         | ADMIN        |
|---------------------------------|--------------|--------------|
| `POST /api/auth/register`       | Yes (public) | Yes (public) |
| `POST /api/auth/login`          | Yes (public) | Yes (public) |
| `GET  /api/artist`              | Yes          | Yes          |
| `POST /api/artist`              | No           | Yes          |
| `GET  /api/playlist`            | Yes          | Yes          |
| `POST /api/playlist`            | Yes          | Yes          |
| `PATCH /api/playlist/:id`       | Own only     | Yes          |
| `DELETE /api/playlist/:id`      | No           | Yes          |

---

## 7. Resource ownership (PlaylistOwnershipGuard)

Role checks (`@Roles`) are coarse-grained: they can say "only USERs", but not "only the user who owns this specific playlist". `PlaylistOwnershipGuard` fills that gap.

**The rule it enforces:**

- `ADMIN` → always allowed (bypasses the ownership check)
- `USER` → allowed only if `playlist.ownerId === req.user.id`
- Anyone else → `403 Forbidden`

**How it works:**

```typescript
@UseGuards(PlaylistOwnershipGuard)  // applied per-endpoint, not globally
@Patch(':id')
update(...) { ... }
```

The guard reads `req.params.id` (the playlist ID from the URL) and `req.user.id` (from the JWT), then queries the database for a playlist matching BOTH. If no row is found, the user doesn't own it → 403.

**Why check in a guard instead of the service?**

Keeping the ownership check in a guard separates access-control logic from business logic. The service method runs only after authorization is confirmed — it never needs to re-check ownership.

---

## 8. The @Public() decorator and global guards

### Why all endpoints are protected by default

In `AppModule`, both guards are registered globally using the `APP_GUARD` token:

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },  // runs first
  { provide: APP_GUARD, useClass: RolesGuard },    // runs second
],
```

This means **every route** is protected by JWT authentication automatically — no `@UseGuards()` needed. If a developer adds a new controller and forgets to add `@UseGuards`, the endpoint is still protected. This "secure by default" pattern prevents accidental exposure.

### How @Public() opts out

Since `JwtAuthGuard` runs globally, we need a way to mark specific routes (like `/register` and `/login`) as accessible without a token. The `@Public()` decorator does this:

```typescript
// Sets metadata: { isPublic: true } on the route handler.
export const Public = () => SetMetadata('isPublic', true);
```

`JwtAuthGuard` reads this metadata before running Passport:

```typescript
canActivate(context: ExecutionContext) {
  const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
    context.getHandler(),
    context.getClass(),
  ]);
  if (isPublic) return true;          // skip JWT check entirely
  return super.canActivate(context);  // run Passport JWT validation
}
```

**The pattern: secure by default, explicit opt-out.** This is safer than the inverse (unprotected by default, explicit opt-in), because forgetting to add `@Public()` locks you out of the endpoint — a visible problem. Forgetting to add `@UseGuards()` silently exposes the endpoint — an invisible security hole.

---

## 9. Passport strategies explained

**Passport.js** is an authentication middleware with 500+ "strategies". Each strategy answers: *"Is this request authenticated?"* using a different method (local password, Google OAuth, GitHub, JWT, etc.).

In NestJS, a strategy is a class that:

1. Extends `PassportStrategy(Strategy, 'name')` — registers it under a string name.
2. Calls `super({...})` to configure how credentials are extracted from the request.
3. Implements `validate(payload)` — called after the credentials are verified. The return value becomes `req.user`.

```typescript
// The 'jwt' strategy reads the Bearer token, verifies the signature,
// then calls validate() with the decoded payload.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(...) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userService.getUserByEmail(payload.username);
    return { id: user.id, username: user.email, role: user.role }; // → req.user
  }
}
```

---

## 10. Guards explained

A **Guard** is a class that implements `CanActivate`. NestJS runs it **before** the controller method. If `canActivate()` returns false or throws, the request is rejected and the controller never runs.

```text
Request → [Middleware] → [Guards] → [Interceptors] → [Pipes] → Controller
```

Three guards are in use in this project:

| Guard                    | Scope        | Rejects with | Purpose                           |
|--------------------------|--------------|--------------|-----------------------------------|
| `JwtAuthGuard`           | Global       | 401          | Validates the JWT token           |
| `RolesGuard`             | Global       | 403          | Checks user's role vs @Roles()    |
| `PlaylistOwnershipGuard` | Per-endpoint | 403          | Checks playlist ownerId vs user   |

```typescript
// Apply a specific guard to a single endpoint:
@UseGuards(PlaylistOwnershipGuard)
@Patch(':id')
update(...) { ... }
```

`AuthGuard('jwt')` is a built-in Passport guard. When triggered, it runs the `'jwt'` strategy registered by `JwtStrategy`. We extend it into `JwtAuthGuard` so we have a named class that's easy to mock in tests and extend with custom logic later.

---

## 11. Key files and their roles

| File                                           | Role                                                                    |
|------------------------------------------------|-------------------------------------------------------------------------|
| `src/app.module.ts`                            | Registers JwtAuthGuard and RolesGuard as global guards                  |
| `src/auth/auth.module.ts`                      | Wires PassportModule, JwtModule, UserModule together                    |
| `src/auth/auth.controller.ts`                  | HTTP endpoints: register, login, refresh                                |
| `src/auth/auth.service.ts`                     | Orchestrates register, login, and refresh flows; signs JWTs             |
| `src/auth/strategies/jwt.strategy.ts`          | Teaches Passport how to validate a JWT; returns AuthUser for req.user   |
| `src/auth/guards/jwt.guard.ts`                 | Global door-bouncer; supports @Public() escape hatch                    |
| `src/auth/guards/roles.guard.ts`               | Reads @Roles() metadata and checks req.user.role                        |
| `src/auth/guards/playlist-ownership.guard.ts`  | DB query to verify playlist.ownerId matches req.user.id                 |
| `src/auth/decorators/public.decorator.ts`      | @Public() — marks endpoints that skip JWT authentication                |
| `src/auth/decorators/roles.decorator.ts`       | @Roles() — declares which roles may access an endpoint                  |
| `src/auth/decorators/current-user.decorator.ts`| @CurrentUser() — injects req.user as a typed controller parameter       |
| `src/auth/dto/register.dto.ts`                 | Input shape for registration (strong password validation)               |
| `src/auth/dto/login.dto.ts`                    | Input shape for login                                                   |
| `src/auth/dto/refresh.dto.ts`                  | Input shape for token refresh (userId + refreshToken)                   |
| `src/auth/types/jwt.ts`                        | TypeScript interface for the JWT payload (sub + username)               |
| `src/auth/types/auth-user.ts`                  | TypeScript interface for req.user in protected controllers              |
| `src/user/user.entity.ts`                      | User DB schema; passwordHash and refreshTokenHash excluded by default   |
| `src/user/user.service.ts`                     | bcrypt hashing, password verify, refresh token store/validate           |
| `src/user/user.module.ts`                      | Registers User entity and exports UserService                           |
| `src/common/types/user-role.ts`                | UserRole enum (USER / ADMIN) used by entity, guards, and decorators     |
| `public/app.js`                                | Browser client: token storage, silent refresh, session restore, UI      |

---

## 12. Security decisions explained

### 12.1 Generic error messages on login

```typescript
// WRONG — reveals which emails are registered:
if (!user) throw new NotFoundException('User not found');
if (!valid) throw new BadRequestException('Wrong password');

// CORRECT — both cases return the same error:
throw new BadRequestException('Invalid credentials');
```

If an attacker gets "user not found" for unknown emails, they can probe which emails are registered and then target those accounts. A uniform message makes the endpoint useless for enumeration.

### 12.2 passwordHash excluded from all default queries

```typescript
@Column({ select: false })
passwordHash!: string;
```

This prevents the hash from accidentally appearing in a response body, a log line, or a serialized object. The only place it's loaded is `verifyPassword`, which uses an explicit `.addSelect('user.passwordHash')` QueryBuilder call.

The same pattern is applied to `refreshTokenHash` and `refreshTokenExpiry`.

### 12.3 Email normalized to lowercase before storage and lookup

```typescript
const email = credentials.email.toLowerCase();
```

Without this, `User@Example.com` and `user@example.com` would be treated as different accounts. Normalization happens on both `createUser` and `verifyPassword` so lookups always match.

### 12.4 Short access token expiry

`JWT_EXPIRES_IN=60s` in `.env.example` is intentionally short for demo purposes (you'd use `15m` or `1h` in production). Short expiry limits the damage window if a token is stolen — it becomes useless quickly on its own. Refresh tokens handle session continuity.

### 12.5 JWT_SECRET never in source code

The secret is loaded from the environment via `ConfigService`. It must be a long, random string. Anyone who knows this secret can forge valid tokens — treat it like a database password.

### 12.6 Two separate JWT secrets

`JWT_SECRET` (for access tokens) and `JWT_REFRESH_SECRET` (for refresh tokens) are different values. This means:

- A refresh token cannot be used as an access token on a protected endpoint.
- An access token cannot be used to call the `/refresh` endpoint.
- Rotating one secret does not invalidate tokens signed with the other.

---

## 13. How to add protection to an existing endpoint

Since `JwtAuthGuard` is registered globally, new endpoints are protected automatically. You only need to add `@UseGuards` for endpoint-specific guards.

**Restrict by role:**

```typescript
@Roles(UserRole.ADMIN)
@Delete(':id')
remove(@Param('id', ParseUUIDPipe) id: string) { ... }
```

**Access the logged-in user:**

```typescript
@Post()
create(
  @Body() body: PlaylistCreateDto,
  @CurrentUser() user: AuthUser,  // ← typed, no @Req() needed
) {
  return this.playlistService.create(body, user);
}
```

**Add resource ownership protection:**

```typescript
@UseGuards(PlaylistOwnershipGuard)
@Patch(':id')
update(@Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateDto) { ... }
```

**Tell Swagger the endpoint needs a Bearer token (once per controller):**

```typescript
@ApiBearerAuth('access-token')
@Controller('playlist')
export class PlaylistController { ... }
```

---

## 14. Getting started

### Prerequisites

Make sure Postgres is running (same setup as the previous lesson):

```bash
docker run \
  --name sedc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=music \
  -p 5433:5432 \
  -d postgres:16
```

### Run the app

```bash
# Copy the example env file and fill in your values
cp .env.example .env

# Install dependencies
npm install

# Start with auto-reload
npm run start:dev
```

Useful URLs after startup:

- [http://localhost:3000/docs](http://localhost:3000/docs) — Swagger UI (use the "Authorize" button to test protected endpoints)
- [http://localhost:3000/docs-json](http://localhost:3000/docs-json) — OpenAPI JSON

### Try it with curl

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@music.com", "password": "StrongPass1!" }'

# Login — copy accessToken and refreshToken from the response
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@music.com", "password": "StrongPass1!" }'

# Call a protected endpoint (replace <token> with your accessToken)
curl http://localhost:3000/api/artist \
  -H "Authorization: Bearer <token>"

# Try without a token — should get 401
curl http://localhost:3000/api/artist

# Refresh tokens when access token expires
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "userId": "<userId>", "refreshToken": "<refreshToken>" }'
```

### Try it with Swagger UI

1. Open [http://localhost:3000/docs](http://localhost:3000/docs)
2. Use `POST /api/auth/login` to get a token
3. Click the **Authorize** button (top right) and paste the access token
4. All subsequent requests will include the `Authorization: Bearer` header automatically

---

## 15. Folder map for this lesson

| File                                           | What to study                                                               |
|------------------------------------------------|-----------------------------------------------------------------------------|
| `src/app.module.ts`                            | Global guard registration; why APP_GUARD order matters                      |
| `src/auth/auth.module.ts`                      | How PassportModule, JwtModule.registerAsync, and UserModule are combined    |
| `src/auth/auth.controller.ts`                  | Why register/login/refresh are public; @Body() and @Public()                |
| `src/auth/auth.service.ts`                     | Login and refresh flows; why all errors become generic responses            |
| `src/auth/strategies/jwt.strategy.ts`          | How Passport validates a JWT; what validate() returns                       |
| `src/auth/guards/jwt.guard.ts`                 | Global guard + @Public() escape hatch; Reflector usage                      |
| `src/auth/guards/roles.guard.ts`               | RBAC guard; how Reflector reads @Roles() metadata                           |
| `src/auth/guards/playlist-ownership.guard.ts`  | Resource-level authorization; async guard with DB query                     |
| `src/auth/decorators/public.decorator.ts`      | SetMetadata pattern; why global guards need an escape hatch                 |
| `src/auth/decorators/roles.decorator.ts`       | @Roles() as a metadata decorator; how it pairs with RolesGuard              |
| `src/auth/decorators/current-user.decorator.ts`| createParamDecorator; why @CurrentUser() is better than @Req()              |
| `src/auth/dto/register.dto.ts`                 | @IsStrongPassword and why DTOs are not entities                             |
| `src/auth/dto/login.dto.ts`                    | Why login uses @IsString and not @IsStrongPassword                          |
| `src/auth/dto/refresh.dto.ts`                  | Why both userId and refreshToken are required                               |
| `src/auth/types/jwt.ts`                        | Why sub/username; what goes in a payload and what doesn't                   |
| `src/auth/types/auth-user.ts`                  | Why req.user is a minimal object, not the full entity                       |
| `src/user/user.entity.ts`                      | { select: false } on sensitive columns; UserRole enum                       |
| `src/user/user.service.ts`                     | bcrypt cost factor; verifyPassword QueryBuilder; refresh token storage      |
| `src/common/types/user-role.ts`                | Why an enum; how the role flows from DB → JWT → guard                       |
| `src/playlist/playlist.controller.ts`          | All three layers of access control working together                         |

---

## 16. Exercises

1. **Add a `GET /api/auth/me` endpoint** that returns the logged-in user's profile. Use `@CurrentUser()` to inject `req.user` and return it. Make sure it is NOT marked `@Public()`.

2. **Increase the bcrypt cost factor.** Change the cost from `10` to `12` in `UserService.createUser` and measure how registration time changes. What is the trade-off between security and user experience?

3. **Add `@ApiBearerAuth('access-token')` to a controller.** Check how the Swagger UI changes — the padlock icon should appear next to protected endpoints.

4. **Simulate token expiry.** Set `JWT_EXPIRES_IN=5s` in `.env`, log in, wait 6 seconds, and call a protected endpoint. What error do you get? What HTTP status? Then use the refresh token to get a new access token.

5. **Explore `jwt.io`.** Copy a token from a login response, paste it at [https://jwt.io](https://jwt.io), and decode the payload. Note that you can read everything without the secret. What data is visible? What does this tell you about what NOT to put in a token?

6. **Test the ownership guard.** Register two users (userA and userB). Log in as userA and create a playlist. Then log in as userB and try to PATCH that playlist. What response do you get? Now promote userB to admin in the database and try again — what changes?

7. **Add a new admin-only endpoint.** Add `DELETE /api/artist/:id` and protect it with `@Roles(UserRole.ADMIN)`. Verify that a regular USER gets 403 and an ADMIN can delete.

8. **Understand refresh token rotation.** Log in, save the refresh token. Use it to refresh. Now try to use the **original** refresh token again. What happens? Why? This is the security property that rotation provides.

9. **Observe auto-refresh in DevTools.** Log in, open the **Network** tab in DevTools. Wait for the access token to expire (2 minutes with the current config — watch the "Token Expiry" countdown in the UI). Make any API call. Watch the Network tab — you should see `POST /api/auth/refresh` fire automatically before the original request is retried. This is `silentRefresh()` in action.

10. **See session persistence.** Log in, then hard-refresh the browser page (`Ctrl+Shift+R` / `Cmd+Shift+R`). Notice you are still recognised (the topbar shows your email and role). Open DevTools → **Application** → **Local Storage** → `localhost`. Find the `nestjs_auth_session` key. What data is stored? What is absent from it in the memory-only variant?

11. **Simulate two concurrent 401s.** Temporarily add `console.log('refresh started')` inside `silentRefresh()` in `public/app.js`. Log in, wait for the token to expire, then click **Load All Artists** and **Load All Songs** at the same time. How many `'refresh started'` lines appear in the console? Why only one, even though two requests both failed with 401?

12. **Decode your JWT manually.** Log in, copy the full `accessToken` from the Response panel. Go to [jwt.io](https://jwt.io) and paste it into the Encoded box. What fields appear in the Payload section? Now try editing the `exp` value in the decoded panel — does the signature still verify? What does this tell you about tampering with JWTs?

13. **Compare storage locations.** Open DevTools → **Application** → **Local Storage** and find the `nestjs_auth_session` entry. Copy the `refreshToken` value. Now log out (which calls `localStorage.removeItem`). Confirm the key is gone. What would happen if a malicious script ran `localStorage.getItem('nestjs_auth_session')` before you logged out? How would using an `httpOnly` cookie instead change that scenario?

---

## 17. Further reading

### Official documentation

- [NestJS — Authentication](https://docs.nestjs.com/security/authentication)
- [NestJS — Authorization](https://docs.nestjs.com/security/authorization)
- [NestJS — Guards](https://docs.nestjs.com/guards)
- [Passport.js documentation](http://www.passportjs.org/)
- [passport-jwt strategy](https://github.com/mikenicholson/passport-jwt)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)
- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)

### Security background

- [OWASP — Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP — JWT Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [jwt.io — interactive JWT decoder/encoder](https://jwt.io)
- [Why bcrypt? (attack-resistant password hashing)](https://auth0.com/blog/hashing-in-action-understanding-bcrypt/)

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
