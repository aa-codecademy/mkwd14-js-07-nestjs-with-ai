---
applyTo: "src/auth/**"
---

# Auth Module — Copilot Instructions

These instructions apply to every file under `src/auth/`.

---

## Token Architecture

This project uses **two separate JWT tokens**:

| Token | Secret env var | Lifetime | Purpose |
|-------|---------------|---------|---------|
| Access token | `JWT_SECRET` | Short (e.g. 2 min) | Sent on every API request in `Authorization: Bearer` |
| Refresh token | `JWT_REFRESH_SECRET` | Long (e.g. 7 days) | Exchanged for a new pair via `POST /auth/refresh` |

**Why two secrets?** A single secret would allow a refresh token to be submitted as an access token (and vice-versa). Different secrets prevent cross-token substitution.

---

## Token Generation — `AuthService.#generatePairOfTokens()`

Both tokens are generated together in the private method `#generatePairOfTokens()`. Always regenerate both tokens together:

1. Sign the **access token** with `JWT_SECRET` + short `expiresIn`.
2. Sign the **refresh token** with `JWT_REFRESH_SECRET` + long `expiresIn`.
3. Call `UserService.saveRefreshToken()` to **bcrypt-hash and persist** the refresh token.

**Do not** sign tokens outside of this method. **Do not** store the raw refresh token in the database — only the bcrypt hash.

---

## Refresh Token Rotation

Every successful call to `POST /auth/refresh` must:

1. Validate the incoming refresh token against the stored bcrypt hash (`UserService.getUserByRefreshToken`).
2. Issue a **brand-new** access + refresh token pair.
3. Overwrite the stored hash in the DB — the old refresh token is now permanently invalid.

This is **refresh token rotation**. If a stolen refresh token is used, the legitimate user's next refresh will fail (their token was replaced), which alerts them to the compromise.

---

## Guard Execution Order

Guards are registered globally in `AppModule` via `APP_GUARD`. They always run in this order:

```
Request → JwtAuthGuard → RolesGuard → Controller
```

- `JwtAuthGuard` — validates the JWT and populates `req.user`. Routes with `@Public()` are skipped.
- `RolesGuard` — reads `@Roles(...)` metadata and checks `req.user.role`. Runs **after** `JwtAuthGuard` because it depends on `req.user`.

**Do not** change this registration order.

---

## @Public() — Opting Out of Auth

Global JWT protection means **every route is protected by default**. Use `@Public()` only on routes that must be reachable without a token:

```typescript
// ✅ Correct — login endpoint has no token yet
@Public()
@Post('login')
login() { ... }

// ❌ Wrong — never skip auth on a route that reads user-specific data
@Public()
@Get('profile')
getProfile() { ... }
```

Do **not** place `@Public()` on an entire controller unless every single route in it is truly unauthenticated (e.g. a public health-check controller).

---

## @CurrentUser() — Extracting the Logged-in User

Use the `@CurrentUser()` parameter decorator instead of reading `@Req() req` and accessing `req.user` manually:

```typescript
// ✅ Preferred
@Post('logout')
logout(@CurrentUser() user: AuthUser) { ... }

// ❌ Avoid — more verbose and couples the controller to the raw request shape
@Post('logout')
logout(@Req() req: { user: AuthUser }) { ... }
```

`@CurrentUser()` is defined in `auth/decorators/current-user.decorator.ts`. It returns an `AuthUser` object (`{ id, username, role }`).

---

## Strategies — Passport Plug-ins

### LocalStrategy (`src/auth/strategies/local.strategy.ts`)
- Handles `POST /auth/login` — extracts `email` + `password` from the request body.
- Calls `UserService.verifyPassword()`.
- On success, returns the full `User` object which Passport attaches to `req.user`.
- Used by `LocalAuthGuard` which wraps `AuthGuard('local')`.

### JwtStrategy (`src/auth/strategies/jwt.strategy.ts`)
- Handles **every subsequent protected request**.
- Extracts the token from `Authorization: Bearer <token>`.
- Verifies the signature against `JWT_SECRET` and checks expiry.
- Calls `validate(payload)` which looks up the user from DB and returns `AuthUser`.
- The returned `AuthUser` is attached to `req.user`.

**Do not** verify JWT signatures manually anywhere else — let the strategy do it.

---

## Error Message Discipline

Auth endpoints must **never** reveal whether a failure is due to "user not found" vs "wrong password". Both cases must return the same generic message.

```typescript
// ✅ Correct — all failures look identical from the outside
throw new BadRequestException('Invalid credentials');

// ❌ Wrong — allows email enumeration
throw new NotFoundException('User not found');
```

The same rule applies to the refresh flow (`UnauthorizedException('Invalid or expired token')`) and the forgot-password flow (always return the same success-looking message).

Always **log** the real error internally before throwing the sanitized one.

---

## DTOs in `src/auth/dto/`

Every DTO must use `class-validator` decorators. The global `ValidationPipe` in `main.ts` runs before the controller method — if validation fails, the controller is never reached.

| DTO file | Used by |
|----------|---------|
| `register.dto.ts` | `POST /auth/register` |
| `login.dto.ts` | `POST /auth/login` (also used by `LocalStrategy`) |
| `refresh.dto.ts` | `POST /auth/refresh` |
| `forgot-password.dto.ts` | `POST /auth/forgot-password` |
| `reset-password.dto.ts` | `POST /auth/reset-password` |

When adding new auth endpoints, always create a corresponding DTO rather than accepting a plain object.

---

## Swagger Decorators on Auth Endpoints

Every controller method must have:

- `@ApiOperation({ summary: '...' })` — one-line description shown in Swagger UI
- At least one `@ApiXxxResponse({ description: '...' })` for each distinct HTTP status the endpoint can return

`@ApiBearerAuth('access-token')` is required on any endpoint that is NOT `@Public()` so Swagger UI shows the lock icon and lets testers send a token.
