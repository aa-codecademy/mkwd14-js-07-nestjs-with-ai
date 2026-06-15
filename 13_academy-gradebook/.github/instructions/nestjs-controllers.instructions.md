---
applyTo: '**/src/**/*.controller.ts'
---

# Controller conventions

Controllers are **thin**: validate/extract input, delegate to a service, return its result.
No business logic, no data access here.

- Decorate the class with `@ApiTags('<resource>')` and `@Controller('<resource>')` (plural, kebab).
- Inject services as `private readonly`: `constructor(private readonly studentsService: StudentsService) {}`.
- One HTTP-verb decorator per method (`@Get()`, `@Post()`, `@Delete(':id')`, …). Let the method return the service Promise directly — don't `await` then re-return.
- Bodies come in as a DTO: `create(@Body() dto: CreateStudentDto)`.
- Route params that are Mongo ids use the shared pipe:
  `@Param('id', ParseObjectIdPipe) id: Types.ObjectId` (then `id.toString()` into the service).
- Set non-200 success codes explicitly: `@HttpCode(HttpStatus.NO_CONTENT)` on deletes.
- Document responses with `@nestjs/swagger` decorators on every route:
  `@ApiCreatedResponse`, `@ApiOkResponse`, `@ApiNoContentResponse`, `@ApiNotFoundResponse`,
  each with a `description`.
- Do **not** throw or build error responses here — let the service throw Nest exceptions.
