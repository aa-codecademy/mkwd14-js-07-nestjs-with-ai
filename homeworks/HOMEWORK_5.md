# Homework 5 — Pet Adoption Center API + Authentication & Authorization

Extend your **Homework 4** project by adding a complete **authentication and authorization** layer to the API you already built.

This homework does **not** require new business features. Do not change domain rules, do not redesign endpoints, and do not break existing functionality. Your job is to secure the API you already have.

> Keep PostgreSQL, TypeORM, DTO validation, Swagger documentation, and endpoint behavior exactly as they are in Homework 4. The only new work is authentication and authorization.

---

## What's new compared to Homework 4

- A `User` entity and a dedicated `AuthModule` are added to the project.
- Users can register and log in — the login response includes a signed **JWT access token**.
- A global `JwtAuthGuard` protects every endpoint by default.
- A `@Public()` decorator marks the few endpoints that must remain open (register, login).
- A `RolesGuard` enforces role-based rules: `USER` vs `ADMIN`.
- **Bonus:** Refresh token rotation — the login and refresh endpoints return both an access token and a refresh token.
- **Bonus:** An ownership guard restricts `USER`-role users to managing only the resources they created.

---

## Main goals

1. Implement `POST /auth/register` and `POST /auth/login`.
2. Protect all existing resource endpoints with a JWT guard applied **globally**.
3. Add role-based access control (RBAC) using a `USER` / `ADMIN` role enum.
4. Document the new auth endpoints and security scheme in Swagger.

---

## Required setup

Install the packages you need for JWT authentication:

```bash
cd pet-adoption-api
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install -D @types/passport-jwt
```

---

## Part 1 — User entity and registration

### 1.1 User entity

Create a `User` entity with at least:

| Column         | Type          | Constraints                              |
| -------------- | ------------- | ---------------------------------------- |
| `id`           | `uuid`        | primary key, auto-generated              |
| `email`        | `varchar`     | unique, not null                         |
| `passwordHash` | `varchar`     | not null — **never expose in responses** |
| `role`         | `enum`        | `USER` or `ADMIN`, default `USER`        |
| `createdAt`    | `timestamptz` | auto                                     |
| `updatedAt`    | `timestamptz` | auto                                     |

Mark `passwordHash` with `{ select: false }` on the TypeORM column so it is never returned in queries unless explicitly selected.

### 1.2 Role enum

Create a `UserRole` enum:

```typescript
export enum UserRole {
	USER = 'user',
	ADMIN = 'admin',
}
```

### 1.3 UserService

Create a `UserModule` with a `UserService` that exposes at minimum:

- `createUser(email, passwordHash): Promise<User>` — saves a new user; throws `ConflictException` if the email already exists.
- `findByEmail(email): Promise<User | null>` — loads the user including `passwordHash` (needed for login verification).
- `findById(id): Promise<User | null>` — loads a user by primary key.

### 1.4 Register endpoint

`POST /auth/register`

- Accept `{ email, password }` in the request body.
- Validate: `email` is a valid email address; `password` is at minimum 8 characters.
- Hash the password with **bcrypt** before storing it — never store plaintext passwords.
- Return the saved `User` object (without `passwordHash`).
- Return **409 Conflict** if the email is already registered.

Install bcrypt:

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

---

## Part 2 — Login and JWT access tokens

### 2.1 Login endpoint

`POST /auth/login`

- Accept `{ email, password }` in the request body.
- Look up the user by email (selecting the `passwordHash` column explicitly).
- Compare the provided password with the stored hash using `bcrypt.compare`.
- On success, return `{ user, accessToken }`.
  - `accessToken` is a **JWT** signed with a secret from your `.env` file.
  - The JWT payload must include at minimum `{ sub: user.id, role: user.role }`.
  - Set a sensible expiry (e.g. `15m`).
- Return **400 Bad Request** with the message `"Invalid credentials"` for both "user not found" and "wrong password" — **use the same message for both** to prevent user enumeration.

Store your JWT secret and expiry in `.env`:

```
JWT_SECRET=your_very_long_random_secret
JWT_EXPIRES_IN=15m
```

Load them with `@nestjs/config`.

### 2.2 JWT strategy and global guard

Create a **Passport JWT strategy** (`JwtStrategy`) that:

- Reads the token from the `Authorization: Bearer <token>` header.
- Verifies the signature and expiry.
- Calls `validate(payload)` and returns an `AuthUser` object `{ id, role }`.

Create a `JwtAuthGuard` that wraps the Passport strategy.

Register the guard **globally** in `AppModule` using `APP_GUARD` so every endpoint is protected by default:

```typescript
{ provide: APP_GUARD, useClass: JwtAuthGuard }
```

### 2.3 @Public() decorator

Create a `@Public()` decorator that attaches metadata to a route or controller. Update `JwtAuthGuard` to skip token validation when `@Public()` is present.

Apply `@Public()` to at least:

- `POST /auth/register`
- `POST /auth/login`

---

## Part 3 — Role-based access control

### 3.1 RolesGuard

Create a `RolesGuard` and register it globally (after `JwtAuthGuard` in the `APP_GUARD` list).

The guard must:

- Read the required roles from the `@Roles(...)` decorator metadata.
- If no roles are required, allow any authenticated user through.
- If roles are required, compare `req.user.role` against the list — throw **403 Forbidden** if the user's role is not included.

### 3.2 @Roles() decorator

Create a `@Roles(...roles: UserRole[])` decorator that stores the required roles as metadata on the handler or controller class.

### 3.3 Apply role rules to existing endpoints

Apply `@Roles` restrictions according to the table below. All other endpoints not listed remain accessible to **any authenticated user** (USER or ADMIN):

| Operation          | Required role |
| ------------------ | ------------- |
| Create a shelter   | `ADMIN`       |
| Update a shelter   | `ADMIN`       |
| Delete a shelter   | `ADMIN`       |
| Create a tag       | `ADMIN`       |
| Delete a tag       | `ADMIN`       |
| Delete any pet     | `ADMIN`       |
| Delete any adopter | `ADMIN`       |

The full read endpoints (`GET`) for all resources remain open to any authenticated user.

### 3.4 @CurrentUser() decorator

Create a `@CurrentUser()` parameter decorator that extracts the `AuthUser` from `req.user`. Use it in controllers wherever the current user's identity is needed.

---

## Part 4 — Swagger security documentation

Update your Swagger configuration from Homework 4 to document the authentication scheme:

- Add a **BearerAuth** security scheme to the OpenAPI document.
- Annotate all protected endpoints with `@ApiBearerAuth()`.
- Annotate the `register` and `login` endpoints with `@ApiUnauthorizedResponse` / `@ApiForbiddenResponse` where applicable.
- Document the `register` and `login` request/response shapes with DTOs decorated with `@ApiProperty`.

---

## Bonus A — Refresh tokens

Implement refresh token rotation so clients can stay logged in without requiring the user to re-enter their password.

### What to add

Add a `refreshTokenHash` column (`varchar`, nullable, `{ select: false }`) to the `User` entity.

Add two new endpoints:

**`POST /auth/login`** (update the existing endpoint)

Return a token pair instead of just an access token:

```json
{
  "user": { ... },
  "accessToken": "<short-lived JWT, e.g. 15m>",
  "refreshToken": "<long-lived opaque token, e.g. 7d>"
}
```

- The `refreshToken` is a **random, opaque string** (not a JWT) — generate it with `crypto.randomBytes(32).toString('hex')`.
- Hash it with bcrypt and store the hash in `user.refreshTokenHash`.
- Return the **plaintext** refresh token to the client (only once — it is never stored in plaintext).

**`POST /auth/refresh`** (new endpoint)

Accept `{ userId, refreshToken }` in the body:

- Load the user by `userId` (selecting `refreshTokenHash`).
- Compare the provided token with the stored hash using `bcrypt.compare`.
- If valid: generate a new access token **and** a new refresh token, store the new hash, return the pair.
- Invalidate the old refresh token by overwriting `refreshTokenHash` with the new hash.
- Return **401 Unauthorized** if the token is invalid, expired, or the user is not found.

This pattern is called **refresh token rotation** — the old token becomes useless the moment a new one is issued.

Mark `POST /auth/refresh` with `@Public()` so the JWT guard does not block it.

---

## Bonus B — Ownership-based authorization

Basic `USER`-role users should only be able to modify resources they created. Implement an ownership guard for **pets** (or adopters — your choice, defend it in the README).

### What to add

Add an `ownerId` column (`uuid`, foreign key to `User`, nullable for backwards compatibility) to the `Pet` entity (or whichever resource you chose).

When a `USER` creates a new pet, automatically set `ownerId` to `req.user.id`. When an `ADMIN` creates a pet, `ownerId` may remain null (admins manage all content).

Create a `PetOwnershipGuard` (or equivalent) that:

- Reads `req.user` (populated by `JwtAuthGuard`).
- Short-circuits with `true` if the user is `ADMIN`.
- Queries the database for the resource where `id = :id AND ownerId = :userId`.
- Returns `true` if the row exists (the user owns it).
- Throws **403 Forbidden** if the row does not exist — do **not** reveal whether the resource exists at all.

Apply the guard to the `PATCH` and `DELETE` endpoints for the chosen resource on top of the existing role guards.

---

## What to validate (additions to Homework 4)

### Register payload

- `email` — required, valid email format.
- `password` — required, minimum 8 characters.

### Login payload

- `email` — required, valid email format.
- `password` — required, non-empty string.

### Refresh payload (Bonus A)

- `userId` — required, valid UUID.
- `refreshToken` — required, non-empty string.

---

## What to return when things go wrong

| Scenario                                                     | HTTP status                                   |
| ------------------------------------------------------------ | --------------------------------------------- |
| Register with duplicate email                                | **409 Conflict**                              |
| Login with unknown email or wrong password                   | **400 Bad Request** (`"Invalid credentials"`) |
| Request to a protected endpoint with no token                | **401 Unauthorized**                          |
| Request with a valid token but insufficient role             | **403 Forbidden**                             |
| Request to modify a resource not owned by the user (Bonus B) | **403 Forbidden**                             |
| Refresh with an invalid or expired token (Bonus A)           | **401 Unauthorized**                          |

Use NestJS built-in exceptions (`UnauthorizedException`, `ForbiddenException`, `ConflictException`, `BadRequestException`). Do not invent a custom response shape.

---

## Technical requirements

- JWT secret and expiry live in `.env` and are loaded via `@nestjs/config`.
- `passwordHash` and `refreshTokenHash` columns are **never** returned in API responses.
- The `JwtAuthGuard` and `RolesGuard` are registered globally via `APP_GUARD` in `AppModule`, in that order.
- `@Public()` is the only mechanism to opt out of the global guard — do not conditionally disable the guard through environment flags or other shortcuts.
- Passwords are hashed with **bcrypt** — never store or log plaintext passwords.
- Strict TypeScript stays on (`"strict": true`).

---

## Manual verification checklist

Use this checklist before submission:

### Authentication

1. `POST /auth/register` with valid data → 201, user returned without `passwordHash`.
2. `POST /auth/register` with the same email again → 409.
3. `POST /auth/register` with a password shorter than 8 characters → 400.
4. `POST /auth/login` with correct credentials → 200, response includes `accessToken`.
5. `POST /auth/login` with wrong password → 400, message is `"Invalid credentials"`.
6. `POST /auth/login` with unknown email → 400, **same** message as wrong password.

### Protected endpoints

7. `GET /pets` without an `Authorization` header → 401.
8. `GET /pets` with a valid `Authorization: Bearer <token>` header → 200.
9. `GET /pets` with an expired token → 401.
10. `GET /pets` with a malformed token → 401.

### Role-based rules

11. Log in as a `USER`. Attempt `POST /shelters` → 403.
12. Log in as a `USER`. Attempt `DELETE /tags/:id` → 403.
13. Log in as an `ADMIN`. Attempt `POST /shelters` → 201.
14. Log in as an `ADMIN`. Attempt `DELETE /tags/:id` → 204 (or 200 per your implementation).
15. Both `USER` and `ADMIN` can `GET /shelters`, `GET /pets`, etc. → 200 for both.

### Refresh tokens (Bonus A)

16. `POST /auth/login` → response includes both `accessToken` and `refreshToken`.
17. `POST /auth/refresh` with valid `userId` and `refreshToken` → 200, new token pair returned.
18. `POST /auth/refresh` with the same (now-invalidated) `refreshToken` again → 401.
19. `POST /auth/refresh` with a tampered token → 401.

### Ownership (Bonus B)

20. Log in as user A. Create a pet (pet is now owned by user A).
21. Log in as user B (different USER-role account). Attempt `PATCH /pets/:id` (user A's pet) → 403.
22. Log in as user A. `PATCH /pets/:id` (own pet) → 200.
23. Log in as `ADMIN`. `PATCH /pets/:id` (any pet) → 200.

### Swagger

24. `GET /api/docs` opens Swagger UI without errors.
25. A **Bearer Auth** button is visible in Swagger UI.
26. After entering a valid token in Swagger UI, protected endpoints can be executed successfully.

---

## Submission

Submit the same project from Homework 4, now with authentication added, plus:

- Updated source code with the `AuthModule`, `UserModule`, guards, decorators, and JWT strategy.
- Updated Swagger docs with bearer auth and new auth endpoints documented.

---

## What we are looking for

- The global `JwtAuthGuard` protects every endpoint by default — no route is accidentally left open.
- `@Public()` is used correctly and is the only way to opt out of authentication.
- Passwords are hashed; the hash is never returned or logged.
- Role restrictions match the table above and are enforced by `RolesGuard`, not by ad-hoc `if` statements inside controllers or services.
- The 400 vs 409 vs 401 vs 403 status codes are used precisely — each maps to exactly one kind of failure.
- Swagger UI reflects the security scheme and can be used to test authenticated endpoints interactively.
- Controllers remain thin. Guard logic lives in guards, not in controllers or services.
