# NestJS — intro exercise (SEDC)

This folder is a minimal NestJS app used in class. Read the **theory** section below, then follow the file comments in `src/` while you run and call the API (e.g. with the included Postman collection).

---

## Working inside the course repo (avoid nested Git)

If you **copied** this folder into another project or opened it as its own workspace, you might see a **`.git`** directory inside `02_nest_intro`. That makes Git treat this folder as a separate repository nested inside the main course repo, which leads to confusing status, commits, and pushes.

**Recommended:** delete the nested `.git` folder inside `02_nest_intro` so only the **root** course repository tracks your files:

```bash
# From inside 02_nest_intro (adjust path if needed)
rm -rf .git
```

Keep using `git` from the **repository root** (`mkwd14-js-07-nestjs-with-ai`). If you are unsure, run `git rev-parse --show-toplevel` — it should point to the course root, not `02_nest_intro`.

---

## Nest CLI — first-time setup and usage

The **Nest CLI** (`@nestjs/cli`) scaffolds projects and generates modules, controllers, and services. This folder was created with it; you mainly use it when starting **new** features or projects.

### Prerequisites

- **Node.js** (LTS recommended) and **npm** installed.
- Install dependencies once in this folder:

```bash
npm install
```

The CLI is listed as a dev dependency in `package.json`; use it via **`npx`** or **`npm run`** scripts so you do not need a global install.

### Common commands (first steps)

| Goal | Command |
|------|---------|
| Start app (once) | `npm run start` |
| Start with reload on save | `npm run start:dev` |
| Production build | `npm run build` |
| Run compiled app | `npm run start:prod` |
| Generate a controller (example) | `npx nest generate controller cats` or `npx nest g co cats` |
| Generate a service | `npx nest g service cats` |
| Open CLI help | `npx nest --help` |

Global install is optional: `npm i -g @nestjs/cli` gives you a `nest` command everywhere; using `npx nest` keeps versions aligned with the project.

### Typical workflow for a new Nest project (outside this exercise)

1. `npm i -g @nestjs/cli` *(optional)*
2. `nest new my-api` — interactive project name and package manager.
3. `cd my-api` → `npm run start:dev`.
4. Add files with `nest g module/book`, `nest g controller book`, etc.

For **this** exercise you already have the files; focus on reading `src/` and running the server.

Official reference: [Nest CLI | NestJS docs](https://docs.nestjs.com/cli/overview).

---

## Theory: what is NestJS?

**NestJS** is a Node.js framework for building server applications (REST APIs, GraphQL, microservices, WebSockets, CLI apps). It uses **TypeScript** by default and borrows ideas from Angular: **modules**, **dependency injection**, and **decorators** keep large codebases structured.

Under the hood, the default HTTP adapter is **Express** (Fastify is optional). You write Nest-style controllers and services; Nest translates them into Express routes and middleware.

### Core building blocks

| Concept | Role |
|--------|------|
| **Module** (`@Module`) | A cohesive unit: declares controllers, providers (services), and imports other modules. The root module (`AppModule`) is the entry point for the dependency graph. |
| **Controller** (`@Controller`) | Handles HTTP: maps paths and verbs (`@Get`, `@Post`, …) to handler methods. Should stay thin — delegate logic to services. |
| **Provider / Service** (`@Injectable`) | Business logic and integrations (database, external APIs). Registered in a module’s `providers` array so Nest can **inject** them. |
| **Dependency injection (DI)** | Nest constructs classes and passes dependencies through constructors. You declare `constructor(private readonly appService: AppService)` and Nest supplies `AppService` if it is provided in the module (or imported from another module). |

### Decorators you see in this project

- **`@Module({ … })`** — configures imports, controllers, and providers.
- **`@Controller()` / `@Controller('prefix')`** — base path for routes in that class.
- **`@Get()`, `@Post()`, `@Put()`** — HTTP method + optional sub-path.
- **`@Param('name')`** — value from the route (`/hello/:name`).
- **`@Body()`** — parsed JSON body (for typical REST handlers).
- **`@Injectable()`** — marks a class as a provider Nest can inject.

### Request flow (simplified)

1. HTTP request hits the adapter (Express).
2. Nest matches route → **controller** method.
3. Parameter decorators extract `@Param`, `@Body`, etc.
4. The method may call **services** injected via the constructor.
5. Return value is serialized (often JSON); exceptions become HTTP error responses if you use Nest’s exception filters.

### This repo’s routes (reference)

| Method | Path | Purpose |
|--------|------|--------|
| GET | `/` | Hello string via `AppService` |
| GET | `/hello/:name` | Greeting with route param |
| GET | `/info` | Small JSON object |
| POST | `/user` | Logs body (demo only) |
| PUT | `/user/:id` | Logs id + body (demo only) |
| GET | `/test` | Raw Express `req`/`res` demo |

---

## Project setup

```bash
npm install
```

## Compile and run

```bash
# development
npm run start

# watch mode (recommended while coding)
npm run start:dev

# production build + run
npm run build
npm run start:prod
```

Default URL: `http://localhost:3000`. Override port: `PORT=4000 npm run start`.

## Further reading

- [NestJS Documentation](https://docs.nestjs.com) — official guides (first-party modules, validation, security).
- [NestJS fundamentals](https://docs.nestjs.com/first-steps) — bootstrap, modules, controllers, providers.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
