# NestJS — controllers & routes (SEDC)

This module builds on [`02_nest_intro`](../02_nest_intro/README.md): same Nest bootstrap, but the focus is **HTTP routing**, **status codes**, **query strings**, **redirects**, and a small **REST-style** API for artists (in-memory list on the controller for teaching).

Read the theory below, then trace the comments in `src/` while calling endpoints with a REST client or browser.

---

## Working inside the course repo (avoid nested Git)

If this folder contains its own **`.git`** directory (for example after copying the exercise), Git may treat it as a **nested repository**. That causes confusing commits and status inside the main course repo.

**Recommended:** remove the nested Git metadata so only the course root is one repo:

```bash
# From inside 03_controllers_routes
rm -rf .git
```

Use `git` from the **course repository root**. Verify with `git rev-parse --show-toplevel`.

---

## Theory: controllers and routing

### Controllers

A **controller** class is decorated with `@Controller('optional-prefix')`. Each method uses an HTTP decorator (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`) and an optional path segment. The full path is **prefix + method path**.

Handlers should stay small: parse input, call logic, return a value (Nest serializes objects as JSON). Throw Nest HTTP exceptions (`NotFoundException`, etc.) to send proper status codes and bodies.

### Route parameters and query strings

- **`@Param('id')`** reads `/artist/:id` — values arrive as **strings**; convert when comparing to numbers.
- **`@Query('genre')`** reads `?genre=Rock` — optional queries may be `undefined`; validate before use.

### Route order matters

Static segments should usually be declared **before** dynamic ones. Example: `@Get('search')` must appear **before** `@Get(':id')`. Otherwise a request to `/artist/search` can be matched by `:id` with `id === 'search'`.

### HTTP verbs (REST-style)

| Verb | Typical use |
|------|----------------|
| GET | Read one or many resources |
| POST | Create (often returns the created entity or 201) |
| PUT | Replace an entire resource |
| PATCH | Partial update |
| DELETE | Remove |

`@HttpCode(HttpStatus.NO_CONTENT)` sets **204** when you intentionally send no body (common for DELETE).

### Redirects and metadata

- **`@Redirect(url, statusCode)`** sends a redirect (e.g. 302). Useful for shortcuts like `/` → `/health` or linking out to docs.
- **`@Headers('header-name')`** and **`@Ip()`** extract request metadata for debugging or logging endpoints.

### What this project demonstrates

| Area | Where |
|------|--------|
| Redirects, health, headers | `src/app.controller.ts` |
| CRUD + query search + 404s | `src/artist/artist.controller.ts` |
| Registering two controllers | `src/app.module.ts` |

---

## Project setup

```bash
npm install
```

## Run

```bash
npm run start:dev
```

Default base URL: `http://localhost:3000`.

### Quick reference — useful paths

| Method | Path | Notes |
|--------|------|--------|
| GET | `/` | Redirects to `/health` |
| GET | `/health` | JSON health payload |
| GET | `/docs` | Redirects to Nest docs |
| GET | `/request-info` | User-Agent + IP |
| GET | `/artist` | List artists |
| GET | `/artist/search?genre=Rock` | Filter by genre |
| GET | `/artist/:id` | One artist or 404 |
| POST | `/artist` | Create (JSON body) |
| PUT | `/artist/:id` | Full replace |
| PATCH | `/artist/:id` | Partial update |
| DELETE | `/artist/:id` | 204 No Content |

---

## Tests

```bash
npm run test
npm run test:e2e
```

---

## Further reading

- [Controllers | NestJS](https://docs.nestjs.com/controllers)
- [HTTP exceptions | NestJS](https://docs.nestjs.com/exception-filters)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
