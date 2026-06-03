# NestJS — Authentication with JWT (SEDC)

This lesson adds **stateless JWT authentication** on top of the TypeORM project from the previous lesson. You will learn how to protect endpoints so that only logged-in users can access them.

You will learn:

- What **authentication** is and how it differs from **authorization**
- Why we never store plain-text passwords (and what **bcrypt** does instead)
- What a **JWT** is, what it contains, and why it is self-verifying
- How **Passport.js** and **strategies** work in NestJS
- How **Guards** intercept requests before controllers run
- The full **registration → login → protected request** cycle
- Common security mistakes and why the code avoids them

> The TypeORM, relations, pagination, and filtering knowledge from the previous lesson is still in this project. This README focuses purely on the authentication layer.

---

## 0. Runtime map for this project

- API prefix: `app.setGlobalPrefix('api')` → all REST endpoints are under `/api/*`
- Swagger UI: `/docs` (includes a "Authorize" button to paste your JWT)
- Raw OpenAPI JSON: `/docs-json`
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`
- Protected endpoint example: any endpoint decorated with `@UseGuards(JwtAuthGuard)`

### Environment variables (see `.env.example`)

```env
JWT_SECRET=ultra-large-secret-key-that-should-be-kept-safe-and-not-shared-with-anyone
JWT_EXPIRES_IN=60s
```

`JWT_SECRET` is the HMAC key used to sign and verify tokens. It must be a long random string and must **never** be committed to git. `JWT_EXPIRES_IN` controls how long a token is valid before it expires.

---

## 1. Authentication vs Authorization

These two words are often confused. They mean different things:

| Term               | Question                      | Example                                              |
|--------------------|-------------------------------|------------------------------------------------------|
| **Authentication** | *Who are you?*                | Is this a valid, logged-in user?                     |
| **Authorization**  | *What are you allowed to do?* | Is this user an admin? Can they edit this resource?  |

This lesson covers **authentication only**. Authorization (roles, permissions) is a separate topic that builds on top of it.

---

## 2. Why we never store plain-text passwords

Imagine your database is leaked (it happens — even to large companies). If you stored passwords as plain text, every user's password would be immediately exposed. If they reuse that password on their bank, email, or social media, attackers now own those accounts too.

**The solution: one-way hashing.**

A hash function takes an input and produces a fixed-size output. There is no way to reverse the hash back to the original input (without brute force). When a user logs in, you hash their candidate password with the same algorithm and compare the two hashes — you never need the original.

### Why bcrypt specifically?

Not all hash functions are equal for passwords. MD5 and SHA-256 are designed to be **fast** — a GPU can compute billions per second, making brute-force attacks trivial.

**bcrypt** is deliberately **slow**. It has a "cost factor" (the second argument to `bcrypt.hash`) that controls how many rounds of computation it performs:

```
Cost 10 ≈ ~100ms per hash on modern hardware
Cost 12 ≈ ~400ms
Cost 14 ≈ ~1600ms
```

At cost 10, an attacker trying 1 billion passwords per second on a GPU is slowed to roughly 10 per second. bcrypt also generates a random **salt** per hash automatically, so two users with the same password get completely different hashes — rainbow table attacks don't work.

See `src/user/user.service.ts` — `createUser` method for the implementation.

---

## 3. What is a JWT?

A **JSON Web Token** (JWT) is a compact, URL-safe string that represents a set of claims. It looks like this:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MmQyNWQiLCJ1c2VybmFtZSI6InVzZXJAbXVzaWMuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjE3MDAwMDAwNjB9.V5KCE_1Bnz8sVqmAQx7w9EgFjW0YdqKP_cXwPKt3UxM
```

Three parts separated by `.`:

```
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

```
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

**Trade-off:** JWTs cannot be invalidated before they expire. If a token is stolen, it works until `exp`. Mitigations: short expiry times, token blocklists (giving up some statelessness), or refresh token rotation.

---

## 4. The full authentication flow

```
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
      → jwtService.signAsync(payload, { secret, expiresIn })
    ← return { user, accessToken: "eyJ..." }

PROTECTED REQUEST:
  Client → GET /api/playlist  Authorization: Bearer eyJ...
    → JwtAuthGuard.canActivate()
    → AuthGuard('jwt') triggers JwtStrategy
      → ExtractJwt.fromAuthHeaderAsBearerToken()  ← reads the header
      → verify signature with JWT_SECRET
      → check exp (token not expired)
      → JwtStrategy.validate(payload)
          → UserService.getUserByEmail(payload.username)
          → return AuthUser { id, username }
      → attach AuthUser to req.user
    → controller method runs with req.user available
```

---

## 5. Key files and their roles

| File                                   | Role                                                           |
|----------------------------------------|----------------------------------------------------------------|
| `src/auth/auth.module.ts`              | Wires PassportModule, JwtModule, UserModule together           |
| `src/auth/auth.controller.ts`          | HTTP endpoints: POST /register, POST /login                    |
| `src/auth/auth.service.ts`             | Orchestrates register and login flows, signs JWTs              |
| `src/auth/strategies/jwt.strategy.ts`  | Teaches Passport how to validate a JWT                         |
| `src/auth/guards/jwt.guard.ts`         | Door-bouncer — rejects requests without a valid token          |
| `src/auth/dto/register.dto.ts`         | Input shape for registration (with strong password validation) |
| `src/auth/dto/login.dto.ts`            | Input shape for login                                          |
| `src/auth/types/jwt.ts`                | TypeScript type for the JWT payload                            |
| `src/auth/types/auth-user.ts`          | TypeScript type for req.user in protected controllers          |
| `src/user/user.entity.ts`              | User DB schema (passwordHash excluded from default SELECTs)    |
| `src/user/user.service.ts`             | DB operations: create user, find by email, verify password     |
| `src/user/user.module.ts`              | Registers User entity and exports UserService                  |

---

## 6. Passport strategies explained

**Passport.js** is an authentication middleware with 500+ "strategies". Each strategy answers: *"Is this request authenticated?"* using a different method (local password, Google OAuth, GitHub, JWT, etc.).

In NestJS, a strategy is a class that:
1. Extends `PassportStrategy(Strategy, 'name')` — registers it under a string name.
2. Calls `super({...})` to configure how credentials are extracted from the request.
3. Implements `validate(payload)` — called after the credentials are verified. The return value becomes `req.user`.

```ts
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
    return { id: user.id, username: user.email }; // → req.user
  }
}
```

---

## 7. Guards explained

A **Guard** is a class that implements `CanActivate`. NestJS runs it **before** the controller method. If `canActivate()` returns false or throws, the request is rejected (401 Unauthorized) and the controller never runs.

```
Request → [Middleware] → [Guards] → [Interceptors] → [Pipes] → Controller
```

```ts
// Apply to a single endpoint:
@UseGuards(JwtAuthGuard)
@Get('me')
getProfile(@Req() req) {
  return req.user; // AuthUser { id, username }
}

// Apply to an entire controller:
@UseGuards(JwtAuthGuard)
@Controller('playlist')
export class PlaylistController { ... }
```

`AuthGuard('jwt')` is a built-in Passport guard. When triggered, it runs the `'jwt'` strategy registered by `JwtStrategy`. We extend it into `JwtAuthGuard` so we have a named class that's easy to mock in tests and extend with custom logic later.

---

## 8. Security decisions explained

### 8.1 Generic error messages on login

```ts
// WRONG — reveals which emails are registered:
if (!user) throw new NotFoundException('User not found');
if (!valid) throw new BadRequestException('Wrong password');

// CORRECT — both cases return the same error:
throw new BadRequestException('Invalid credentials');
```

If an attacker gets "user not found" for unknown emails, they can probe which emails are registered and then target those accounts. A uniform message makes the endpoint useless for enumeration.

### 8.2 passwordHash excluded from all default queries

```ts
@Column({ select: false })
passwordHash!: string;
```

This prevents the hash from accidentally appearing in a response body, a log line, or a serialized object. The only place it's loaded is `verifyPassword`, which uses an explicit `.addSelect('user.passwordHash')` QueryBuilder call.

### 8.3 Email normalized to lowercase before storage and lookup

```ts
const email = credentials.email.toLowerCase();
```

Without this, `User@Example.com` and `user@example.com` would be treated as different accounts. Normalization happens on both `createUser` and `verifyPassword` so lookups always match.

### 8.4 Short token expiry

`JWT_EXPIRES_IN=60s` in `.env.example` is intentionally short for demo purposes (you'd use `15m` or `1h` in production). Short expiry limits the damage window if a token is stolen — it becomes useless quickly on its own.

### 8.5 JWT_SECRET never in source code

The secret is loaded from the environment via `ConfigService`. It must be a long, random string. Anyone who knows this secret can forge valid tokens — treat it like a database password.

---

## 9. How to add protection to an existing endpoint

1. Import `JwtAuthGuard`:
   ```ts
   import { JwtAuthGuard } from '../auth/guards/jwt.guard';
   ```

2. Apply it:
   ```ts
   @UseGuards(JwtAuthGuard)
   @Get()
   findAll() { ... }
   ```

3. Access the logged-in user:
   ```ts
   @UseGuards(JwtAuthGuard)
   @Get('my-playlists')
   getMyPlaylists(@Req() req: Request) {
     const user = req.user as AuthUser;
     return this.playlistService.findByOwner(user.id);
   }
   ```

4. Tell Swagger the endpoint needs a Bearer token (add once per controller):
   ```ts
   @ApiBearerAuth('access-token')
   ```

---

## 10. Getting started

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

# Login — copy the accessToken from the response
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@music.com", "password": "StrongPass1!" }'

# Call a protected endpoint (replace <token> with your accessToken)
curl http://localhost:3000/api/artist \
  -H "Authorization: Bearer <token>"

# Try without a token — should get 401
curl http://localhost:3000/api/artist
```

### Try it with Swagger UI

1. Open [http://localhost:3000/docs](http://localhost:3000/docs)
2. Use `POST /api/auth/login` to get a token
3. Click the **Authorize** button (top right) and paste the token
4. All subsequent requests will include the `Authorization: Bearer` header automatically

---

## 11. Folder map for this lesson

| File                                   | What to study                                                              |
|----------------------------------------|----------------------------------------------------------------------------|
| `src/auth/auth.module.ts`              | How PassportModule, JwtModule.registerAsync, and UserModule are combined   |
| `src/auth/auth.controller.ts`          | Why register/login are unguarded; what @Body() does                        |
| `src/auth/auth.service.ts`             | Login flow step by step; why all errors become 400                         |
| `src/auth/strategies/jwt.strategy.ts`  | How Passport validates a JWT; what validate() returns                      |
| `src/auth/guards/jwt.guard.ts`         | What a guard is and where it sits in the request pipeline                  |
| `src/auth/dto/register.dto.ts`         | @IsStrongPassword and why DTOs are not entities                            |
| `src/auth/dto/login.dto.ts`            | Why login uses @IsString and not @IsStrongPassword                         |
| `src/auth/types/jwt.ts`                | Why sub/username; what goes in a payload and what doesn't                  |
| `src/auth/types/auth-user.ts`          | Why req.user is a minimal object, not the full entity                      |
| `src/user/user.entity.ts`              | { select: false } on passwordHash; why no @ApiProperty                     |
| `src/user/user.service.ts`             | bcrypt cost factor; why verifyPassword uses QueryBuilder                   |
| `src/user/user.module.ts`              | Exporting a service for cross-module injection                             |

---

## 12. Exercises

1. **Add a `GET /api/auth/me` endpoint** that returns the logged-in user's profile. Protect it with `JwtAuthGuard` and return `req.user`.

2. **Increase bcrypt cost factor.** Change the cost from `10` to `12` in `UserService.createUser` and measure how registration time changes. What is the trade-off?

3. **Add `@ApiBearerAuth('access-token')` to a controller.** Check how the Swagger UI changes — the padlock icon should appear next to protected endpoints.

4. **Simulate token expiry.** Set `JWT_EXPIRES_IN=5s` in `.env`, log in, wait 6 seconds, and call a protected endpoint. What error do you get? What HTTP status?

5. **Explore `jwt.io`.** Copy a token from a login response, paste it at [https://jwt.io](https://jwt.io), and decode the payload. Note that you can read everything without the secret. What data is visible? What does this tell you about what NOT to put in a token?

6. **Add a refresh token flow (advanced).** Currently tokens expire and the user must log in again. Implement:
   - `POST /api/auth/refresh` that accepts a long-lived refresh token and issues a new short-lived access token.
   - Store the refresh token hash in a new `refresh_tokens` table.
   - Invalidate the refresh token on use ("rotation").

7. **Add role-based authorization.** Add a `role` column (`'user' | 'admin'`) to the User entity. Create a `RolesGuard` that reads a `@Roles('admin')` decorator and rejects requests from non-admin users with 403 Forbidden.

8. **Protect ALL endpoints by default.** Instead of adding `@UseGuards(JwtAuthGuard)` everywhere, register `JwtAuthGuard` as a global guard in `main.ts` and create a `@Public()` decorator that skips it for register/login.

---

## 13. Further reading

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
