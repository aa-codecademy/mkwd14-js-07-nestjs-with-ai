---
applyTo: "src/**/*.ts"
---

# NestJS Conventions — Copilot Instructions

These instructions apply to all TypeScript source files in `src/`.

---

## Module Structure

Every feature (artist, song, album, playlist, auth, user) lives in its own module folder. A module folder contains:

```
feature/
  feature.module.ts      @Module() — wires providers, imports, exports
  feature.controller.ts  HTTP layer only — thin, delegates to service
  feature.service.ts     Business logic, DB calls via injected repository
  feature.entity.ts      TypeORM entity (if this feature owns a DB table)
  dto/                   Input/output shapes validated by class-validator
  entities/              Additional related entities (if needed)
```

**Never** put business logic in a controller. **Never** call a repository directly from a controller.

---

## Dependency Injection

NestJS uses constructor injection. Always declare dependencies as `private readonly`:

```typescript
// ✅ Correct
constructor(
  private readonly userService: UserService,
  private readonly logger: LoggerService,
) {}

// ❌ Wrong — public and mutable, breaks encapsulation
constructor(
  public userService: UserService,
) {}
```

When a service from another module is needed, **import the owning module** (not just the service class). The owning module must `export` the service for it to be available.

---

## Global Guard Registration

Guards registered via `APP_GUARD` in `AppModule` apply to **every route automatically**:

```typescript
// In app.module.ts providers array:
{ provide: APP_GUARD, useClass: JwtAuthGuard },
{ provide: APP_GUARD, useClass: RolesGuard },
```

**Why this matters for Copilot suggestions:** When you create a new controller, do **not** add `@UseGuards(JwtAuthGuard)` — it is already global. Only add `@UseGuards(...)` for guards that are NOT registered globally (e.g. `PlaylistOwnershipGuard`, `LocalAuthGuard`).

---

## HTTP Response Codes

Follow REST conventions:

| Action | Status code | NestJS default? |
|--------|-------------|----------------|
| `@Post` that creates a resource | `201 Created` | ✅ Yes |
| `@Get`, `@Put`, `@Patch`, `@Delete` | `200 OK` | ✅ Yes |
| `@Post` that does NOT create (e.g. login, refresh) | `200 OK` | Override with `@HttpCode(HttpStatus.OK)` |

Always add `@HttpCode(HttpStatus.OK)` on `@Post` handlers that perform an action rather than creating a resource.

---

## DTOs and Validation

All controller inputs go through a DTO class decorated with `class-validator`:

```typescript
// ✅ Correct — typed, validated, documented
@Post('register')
register(@Body() credentials: RegisterDto) { ... }

// ❌ Wrong — unvalidated, no Swagger schema
@Post('register')
register(@Body() body: any) { ... }
```

The global `ValidationPipe` is configured in `main.ts` with:
- `whitelist: true` — strips unknown properties automatically
- `forbidNonWhitelisted: true` — throws on unexpected fields

Always add `@ApiProperty()` to every DTO property for Swagger to generate the correct request body schema.

---

## `@nestjs/config` — Reading Environment Variables

Use `ConfigService` to read `.env` values. **Never** use `process.env.VAR` directly in service or module files:

```typescript
// ✅ Correct
const secret = this.configService.get<string>('JWT_SECRET');

// ❌ Wrong — bypasses NestJS config validation and type safety
const secret = process.env.JWT_SECRET;
```

When a module needs config at startup (e.g. `JwtModule.registerAsync`), use the `useFactory` pattern with `inject: [ConfigService]`.

---

## Swagger Setup

Swagger is configured in `main.ts`. All controllers must use these decorators:

- `@ApiTags('Tag Name')` on the controller class — groups endpoints in the UI
- `@ApiOperation({ summary: '...' })` on each method — one-line description
- `@ApiXxxResponse(...)` for every HTTP status the endpoint can return
- `@ApiBearerAuth('access-token')` on protected endpoints (those without `@Public()`)

Swagger decorators are **documentation only** — they have zero effect on runtime behavior. Never skip them because they feel verbose; they generate the interactive `/docs` page.

---

## Logging

Use the injected `LoggerService` (wraps Winston) — never `console.log` in production code:

```typescript
// ✅ Correct — structured, levelled
this.logger.info('UserService | createUser called', { email });
this.logger.error('AuthService | Login error:', JSON.stringify(error));

// ❌ Wrong — not structured, hard to filter in production
console.log('login error', error);
```

Log context: always prefix the message with `'ServiceName | methodName'` so log lines are easy to grep.

---

## Prefix Convention

The global API prefix is `/api` (set in `main.ts`). Full endpoint paths are therefore:

```
POST /api/auth/login
GET  /api/artist
GET  /api/song/:id
```

Do **not** include `/api` in `@Controller()` or route decorators — it is added globally.

---

## Error Handling

Throw NestJS built-in exceptions — never send raw error strings to the client:

| Situation | Exception to throw |
|-----------|-------------------|
| Resource not found | `NotFoundException` |
| Duplicate / conflict | `ConflictException` |
| Invalid input / logic error | `BadRequestException` |
| Not authenticated | `UnauthorizedException` |
| Authenticated but no permission | `ForbiddenException` |

In auth flows, collapse multiple error types into a single generic message (see `security.instructions.md`).
