# Github Copilot Instructions

This is a small project for the Avenga Academy. It would be used by trainers to assign homework to students, grade the assignments, see reports etc.

## Global conventions (all modules)

- **Language:** TypeScript, `strict` mode on. NestJS 10, Node 20+, CommonJS output.
- **Indentation:** 2 spaces. Single quotes. Trailing commas. Semicolons.
- **Imports:** sorted/grouped — Nest packages first, then third-party, then relative (`./`, `../`).
- **Naming:** files are kebab-case with a role suffix — `*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts`, `*.schema.ts`, `*.guard.ts`, `*.pipe.ts`, `*.interceptor.ts`. Classes are PascalCase; the class name mirrors the file (`StudentsController`).
- **Async:** methods return `Promise<T>`; prefer `async/await`. Mongoose/TypeORM query builders end
  in `.exec()`.
- **Config:** never read `process.env` directly in feature code — inject `ConfigService` (`@nestjs/config`). Use `config.getOrThrow<T>()` for required values, `config.get<T>(key, default)` otherwise. Keep secrets in `.env`; document every key in `.env.example`.

## NestJS patterns (the house style)

- One feature = one folder = one module: `controller` + `service` + `module` + `dto/` (+ `schemas/`
  when persisted). Register the schema/repo via `forFeature` inside that module; `export` the
  service if other modules consume it.
- **Controllers** stay thin — they validate input and delegate to services. **Services** hold all
  business logic and own data access.
- Throw Nest HTTP exceptions (`NotFoundException`, `ConflictException`, `UnauthorizedException`,
  `BadRequestException`) from services — never return error objects or raw status codes.
- Validation is global: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true,
transform: true })` in `main.ts`. Every request body has a **DTO** with `class-validator`
  decorators; every DTO field has `@ApiProperty({ example })` for Swagger.
- Cross-cutting concerns live in `src/common/` (`pipes/`, `interceptors/`, `guards/`, `types/`).

## When generating code

1. Match the **existing files in the same module** before any general convention — copy their import
   order, error style, and decorator usage.
2. Update the `.env.example` when you add new environment variables.
