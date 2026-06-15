---
applyTo: "**/src/common/**/*.ts"
---

# Cross-cutting building blocks (`src/common/`)

Reusable, feature-agnostic pieces live under `src/common/`, grouped by role:
`pipes/`, `interceptors/`, `guards/`, `types/`. Keep them **generic** — no
feature/domain knowledge — so any module can reuse them.

- Every class is `@Injectable()` and implements the matching Nest interface:
  `PipeTransform`, `NestInterceptor`, `CanActivate`.
- **Pipes** transform/validate a single value and throw `BadRequestException` on
  bad input. Type the interface generically:
  `implements PipeTransform<string, Types.ObjectId>`. `ParseObjectIdPipe` is the
  canonical example — validate with `Types.ObjectId.isValid(value)`.
- **Interceptors** wrap the handler and operate on the RxJS stream. Pull the
  request/response via `context.switchToHttp().getRequest<Request>()`; tap the
  result with `.pipe(tap(() => ...))`. Use a named `Logger` instance
  (`new Logger('HTTP')`), never `console.log`.
- **Guards** return `boolean` from `canActivate` and throw
  `UnauthorizedException`/`ForbiddenException` when access is denied — don't
  return `false` silently for auth failures.
- **Ambient types** (`types/*.d.ts`) augment third-party modules via
  `declare module` (e.g. extending `express-session`'s `SessionData`). Keep them
  declaration-only.
- Wire these globally in `main.ts` (`app.useGlobalPipes/Interceptors`) or per-route
  with `@UseGuards(...)` — not by re-instantiating them inside features.
