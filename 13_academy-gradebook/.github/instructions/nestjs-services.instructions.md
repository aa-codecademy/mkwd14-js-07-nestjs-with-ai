---
applyTo: "**/src/**/*.service.ts"
---

# Service conventions

Services own **all business logic and data access**. They are `@Injectable()`.

- Inject the Mongoose model via `@InjectModel(Entity.name) private readonly entityModel: Model<EntityDocument>`
  (or the TypeORM repository in the Postgres module).
- Every public method returns a `Promise`. End Mongoose queries with `.exec()`.
- Guard not-found and conflict states by **throwing Nest exceptions**, with a human-readable message:
  - `throw new NotFoundException(\`Student ${id} not found\`);`
  - `throw new ConflictException(\`${dto.email} is already registered\`);`
  Never return `null`/error objects to the controller for these cases.
- Check uniqueness before `create` (e.g. `findOne({ email })` → `ConflictException`).
- Read-only finders that can't fail (`findAll`) may be non-`async` and just return the query Promise.
- Keep the method vocabulary consistent: `create`, `findAll`, `findOne`, `update`, `remove`.
- No `console.log` for app logging — use Nest's `Logger`.
