# NestJS — modules structure and architecture (SEDC)

This lesson focuses on **how to structure a Nest application with modules** so features stay isolated, reusable, and easy to scale.

You already know controllers/services from previous modules. Here we add proper **feature module boundaries**, **exports/imports**, and **architecture rules** that prevent circular dependency issues.

---

## Working inside the course repo (avoid nested Git)

If `05_modules_structure/.git` exists, remove it so you do not nest one Git repository inside another:

```bash
cd 05_modules_structure
rm -rf .git
```

Commit and push from the repository root (`mkwd14-js-07-nestjs-with-ai`).

---

## What is a module in Nest?

A **module** (`@Module`) is the unit of composition in Nest.

Each module declares:

- `controllers`: HTTP entry points for that feature
- `providers`: services and other injectable classes
- `imports`: other modules it depends on
- `exports`: providers it shares with other modules

Think of modules as **feature containers**:

- `ArtistModule` owns artist APIs and artist business logic
- `SongModule` owns song APIs and song business logic
- `AlbumModule` owns album APIs and album business logic
- `LoggerModule` is a shared cross-cutting module

---

## Architecture in this example

### 1) Root module composes features

`AppModule` should mostly orchestrate:

- feature modules
- global/cross-cutting modules (logging, config, database, auth, etc.)

It should not hold domain business rules.

### 2) Feature module ownership

If `ArtistService` belongs to `ArtistModule`, only `ArtistModule` should provide it.

Other modules use it by:

1. `ArtistModule` exporting `ArtistService`
2. consumer module importing `ArtistModule`

Avoid re-declaring foreign services in another module’s `providers` array.

### 3) Dynamic module pattern

`LoggerModule.forRoot({ level: 'info' })` shows a dynamic module:

- configuration supplied once at bootstrap
- configured providers returned by `forRoot`
- optionally made global to avoid repetitive imports

---

## Circular dependencies and `forwardRef`

### Why circular dependencies happen

Circular references usually appear when two services/modules depend on each other:

- `ArtistService` needs `SongService`
- `SongService` needs `ArtistService`

This creates a cycle in the DI graph.

### What `forwardRef` does

`forwardRef(() => SomeService)` defers resolution and can unblock startup.

It is a **workaround**, not ideal architecture.

### Why avoid it when possible

Frequent `forwardRef` usage is often a design smell:

- features are too tightly coupled
- responsibilities are mixed
- harder testing and maintenance

### Better approach (used in this lesson)

We removed the cycle by making dependencies one-way:

- `SongService` can depend on `ArtistService`
- `ArtistService` does not depend on `SongService`

Result:

- no `forwardRef` needed
- cleaner module graph
- easier to reason about ownership

---

## Real-world patterns to follow

### Do

- Keep modules feature-focused (`users`, `orders`, `payments`, `inventory`)
- Export only what another module truly needs
- Keep dependencies directional (A -> B, avoid A <-> B)
- Create shared modules for cross-cutting concerns (logger, config, mail)
- Use interfaces/ports at boundaries when domains must collaborate

### Avoid

- A giant `AppModule` with all providers
- Copy-pasting providers across modules
- Bidirectional service dependencies
- Using `forwardRef` everywhere instead of refactoring boundaries
- Putting business logic in controllers

---

## Practical anti-cycle strategies

If you detect `forwardRef` pressure, try these in order:

1. **Move orchestration up** to a higher-level service/module that calls both sides.
2. **Extract shared logic** into a third service/module (e.g. `CatalogQueryService`).
3. **Depend on abstractions/tokens** instead of concrete classes.
4. **Split responsibilities** so each service has a single clear domain role.

Use `forwardRef` only when a cycle is temporary or unavoidable for framework-level reasons.

---

## Project layout (guide)

| File | Role |
|------|------|
| `src/app.module.ts` | Composes feature modules and logger dynamic module |
| `src/artist/artist.module.ts` | Owns + exports `ArtistService` |
| `src/song/song.module.ts` | Imports `ArtistModule`, provides `SongService` |
| `src/album/album.module.ts` | Independent feature module |
| `src/logger/logger.module.ts` | Dynamic module (`forRoot`) |

---

## Setup and run

```bash
npm install
npm run start:dev
```

Default URL: `http://localhost:3000`.

---

## Further reading

- [Modules | NestJS](https://docs.nestjs.com/modules)
- [Providers | NestJS](https://docs.nestjs.com/providers)
- [Dynamic modules | NestJS](https://docs.nestjs.com/fundamentals/dynamic-modules)
- [Circular dependency | NestJS](https://docs.nestjs.com/fundamentals/circular-dependency)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
