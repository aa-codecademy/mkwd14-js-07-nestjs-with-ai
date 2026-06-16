# GitHub Copilot Instructions — 12_auth_refactor

This is a **NestJS 11 REST API** for a music-streaming back-end. It uses:

- **PostgreSQL** via **TypeORM** (repository pattern)
- **Passport.js** with a **Local strategy** (email + password login) and a **JWT strategy** (per-request validation)
- **bcrypt** for all password and token hashing
- **class-validator / class-transformer** for DTO validation
- **@nestjs/swagger** for API documentation
- **Winston** (wrapped in a custom `LoggerService`) for structured logging

Treat this folder as a self-contained project. Do **not** assume anything from sibling directories in the repository.

---

## File Map

```
src/
  app.module.ts          Root module — global guards registered here
  main.ts                Bootstrap, Swagger setup, global pipes & prefix

  auth/                  Everything authentication & authorisation
    auth.controller.ts   HTTP entry points (register, login, refresh, logout, …)
    auth.service.ts      Auth business logic (token generation, refresh rotation)
    auth.module.ts       Wires Passport, JWT, and UserModule together
    decorators/          @Public(), @Roles(), @CurrentUser()
    dto/                 Input validation shapes for auth endpoints
    guards/              JwtAuthGuard, LocalAuthGuard, RolesGuard, PlaylistOwnershipGuard
    strategies/          JwtStrategy, LocalStrategy (Passport plug-ins)
    types/               AuthUser, JwtPayload interfaces

  user/
    user.entity.ts       TypeORM entity — sensitive columns are select:false
    user.service.ts      DB operations: create, verify, refresh token mgmt, password reset

  common/
    types/               UserRole enum, Genre enum, SortDirection
    dto/                 PaginationDto (shared)
    providers/           IdGenerator

  db/
    database.module.ts   TypeORM connection (reads from .env)

  logger/
    logger.service.ts    Structured Winston wrapper
```

---

## Architecture Rules

1. **Controllers are thin.** They extract HTTP inputs and delegate everything to a service. No business logic, no direct DB calls.
2. **Services own the business logic.** `AuthService` orchestrates the auth _flow_; `UserService` owns the _data_. Keep them separate.
3. **Entities are not DTOs.** Never return raw entity objects from controllers without checking that sensitive columns (`select:false`) are excluded.
4. **All routes are JWT-protected by default** via the `APP_GUARD` global guards in `AppModule`. Use `@Public()` to opt out on specific endpoints.

---

## Scoped Instruction Files

Additional, focused instructions are in `.github/instructions/`:

| File | Applies to | What it covers |
|------|-----------|----------------|
| `auth.instructions.md`     | `src/auth/**`        | Auth flow, token lifecycle, decorator usage |
| `nestjs.instructions.md`   | `src/**/*.ts`        | Module, guard, DI, Swagger conventions      |
| `security.instructions.md` | `src/**/*.ts`        | bcrypt, error messages, enumeration defence |
| `typeorm.instructions.md`  | `src/**/*.entity.ts`, `src/**/*.service.ts` | QueryBuilder, select:false, migrations |

---

## Quick Reference: Common Decorators

| Decorator | Location | Purpose |
|-----------|----------|---------|
| `@Public()` | `auth/decorators/public.decorator.ts` | Skip JWT auth on a route or controller |
| `@Roles(UserRole.ADMIN)` | `auth/decorators/roles.decorator.ts` | Require a specific role |
| `@CurrentUser()` | `auth/decorators/current-user.decorator.ts` | Extract `AuthUser` from `req.user` |

---

## Environment Variables Required

```
JWT_SECRET              Secret key used to sign access tokens
JWT_EXPIRES_IN          Access token lifetime (e.g. "2m")
JWT_REFRESH_SECRET      Secret key used to sign refresh tokens
JWT_REFRESH_EXPIRES_IN  Refresh token lifetime (e.g. "7d")
DB_HOST / DB_PORT / DB_USERNAME / DB_PASSWORD / DB_NAME
```
