# NestJS — intro exercise (SEDC)



This folder is a minimal NestJS app used in class. Read the **theory** section below, then follow the file comments in `src/` while you run and call the API (e.g. with the included Postman collection).

---

## Theory: what is NestJS?

**NestJS** is a Node.js framework for building server applications (REST APIs, GraphQL, microservices, WebSockets, CLI apps). It uses **TypeScript** by default and borrows ideas from Angular: **modules**, **dependency injection**, and **decorators** keep large codebases structured.

Under the hood, the default HTTP adapter is **Express** (Fastify is optional). You write Nest-style controllers and services; Nest translates them into Express routes and middleware.

### Core building blocks


| Concept                                | Role                                                                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Module** (`@Module`)                 | A cohesive unit: declares controllers, providers (services), and imports other modules. The root module (`AppModule`) is the entry point for the dependency graph.                                                                         |
| **Controller** (`@Controller`)         | Handles HTTP: maps paths and verbs (`@Get`, `@Post`, …) to handler methods. Should stay thin — delegate logic to services.                                                                                                                 |
| **Provider / Service** (`@Injectable`) | Business logic and integrations (database, external APIs). Registered in a module’s `providers` array so Nest can **inject** them.                                                                                                         |
| **Dependency injection (DI)**          | Nest constructs classes and passes dependencies through constructors. You declare `constructor(private readonly appService: AppService)` and Nest supplies `AppService` if it is provided in the module (or imported from another module). |


### Decorators you see in this project

- `**@Module({ … })`** — configures imports, controllers, and providers.
- `**@Controller()` / `@Controller('prefix')**` — base path for routes in that class.
- `**@Get()`, `@Post()`, `@Put()**` — HTTP method + optional sub-path.
- `**@Param('name')**` — value from the route (`/hello/:name`).
- `**@Body()**` — parsed JSON body (for typical REST handlers).
- `**@Injectable()**` — marks a class as a provider Nest can inject.

### Request flow (simplified)

1. HTTP request hits the adapter (Express).
2. Nest matches route → **controller** method.
3. Parameter decorators extract `@Param`, `@Body`, etc.
4. The method may call **services** injected via the constructor.
5. Return value is serialized (often JSON); exceptions become HTTP error responses if you use Nest’s exception filters.

### This repo’s routes (reference)


| Method | Path           | Purpose                       |
| ------ | -------------- | ----------------------------- |
| GET    | `/`            | Hello string via `AppService` |
| GET    | `/hello/:name` | Greeting with route param     |
| GET    | `/info`        | Small JSON object             |
| POST   | `/user`        | Logs body (demo only)         |
| PUT    | `/user/:id`    | Logs id + body (demo only)    |
| GET    | `/test`        | Raw Express `req`/`res` demo  |


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