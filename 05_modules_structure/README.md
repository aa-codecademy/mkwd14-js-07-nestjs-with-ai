# NestJS — providers & dependency injection (SEDC)

This module continues the **artist** HTTP API from [`03_controllers_routes`](../03_controllers_routes/README.md), but moves **data and rules** into an **`ArtistService`** registered as a **provider**. The controller becomes thin: it only maps HTTP to service calls.

You will also see a **custom provider**: an injectable **ID generator** token implemented with `useFactory`.

---

## Working inside the course repo (avoid nested Git)

If **`04_providers_di/.git`** exists, delete it so you do not nest one Git repository inside the main course repo:

```bash
cd 04_providers_di
rm -rf .git
```

Commit and push from the **repository root** only.

---

## Theory: providers and dependency injection

### What is a provider?

In Nest, a **provider** is usually a class marked `@Injectable()` that can be **injected** into controllers or other providers. You list providers in `@Module({ providers: [...] })`. By default Nest creates **one shared instance** per provider (singleton scope in the module).

### Constructor injection

```text
Controller → constructor(private readonly artistsService: ArtistService)
```

Nest resolves `ArtistService` because it is registered in the same module’s `providers`. No manual `new ArtistService()` in application code.

### Custom providers (tokens)

Sometimes the dependency is not a class type — for example a **function** or **configuration**. Nest lets you bind an injection **token** (often a `Symbol`) to a value or factory:

- **`provide`** — the token injectors use (`@Inject(MY_TOKEN)`).
- **`useFactory`** — a function Nest runs to build the value (can depend on other providers later in more advanced setups).

This sample uses a factory that returns a **function** generating numeric IDs (`Date.now()`), so `ArtistService` stays testable and does not hard-code ID creation.

### Interfaces and TypeScript

`Artist` shapes live in **`artist.interface.ts`**. Interfaces are erased at compile time; Nest injection uses runtime tokens (`Symbol`) or classes. **`@Injectable()`** applies to classes, not interfaces.

### Layering

| Layer | Responsibility |
|-------|------------------|
| Controller | HTTP mapping, status codes, delegating to services |
| Service | Business rules, in-memory or future persistence |
| Module | Wiring controllers + providers + exports |

---

## Project layout (guide)

| File | Role |
|------|------|
| `src/app.module.ts` | Registers `ArtistService`, custom `ARTIST_ID_GENERATOR`, controllers |
| `src/artist/artist.controller.ts` | Routes only — calls `ArtistService` |
| `src/artist/artist.service.ts` | In-memory store + `NotFoundException` |
| `src/artist/artist.interface.ts` | Shared TypeScript types |
| `src/common/providers/id-generator.ts` | Token + type for ID generator |

---

## Setup and run

```bash
npm install
npm run start:dev
```

Postman: see `SEDC_2026_Nest.postman_collection.json` if present.

---

## Tests

```bash
npm run test
npm run test:e2e
```

---

## Further reading

- [Providers | NestJS](https://docs.nestjs.com/providers)
- [Custom providers | NestJS](https://docs.nestjs.com/fundamentals/custom-providers)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
