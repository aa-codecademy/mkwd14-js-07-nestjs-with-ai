# Homework 4 — Pet Adoption Center API + Swagger Documentation

Extend your **Homework 3** project by adding complete, production-grade **Swagger / OpenAPI documentation** for the API you already built.

This homework is **documentation only**.
Do not add new business features, do not change domain rules, and do not redesign endpoints. Your job is to make the existing API fully discoverable and testable from Swagger UI.

> Keep PostgreSQL, TypeORM, DTO validation, and endpoint behavior exactly as they are in Homework 3. The only new work is API documentation.

---

## What's new compared to Homework 3

- API docs are auto-generated from your Nest code using `@nestjs/swagger`.
- DTOs become first-class API contracts (schemas with examples and constraints).
- Every endpoint documents:
  - purpose,
  - input parameters,
  - request body shape,
  - success responses,
  - error responses.
- Consumers can explore and execute requests directly from Swagger UI.

---

## Main goal

Expose your API documentation at:

- `GET /api/docs` (interactive Swagger UI).

The docs must clearly represent the real behavior of your current API.

---

## Required setup

Install and configure Swagger in your existing Nest project:

```bash
cd pet-adoption-api
npm install @nestjs/swagger swagger-ui-express
npm run start:dev
```

In your application bootstrap:

- configure OpenAPI metadata (`title`, `description`, `version`),
- create the document through `SwaggerModule.createDocument(...)`,
- expose Swagger UI on `/api/docs`.

---

## Documentation requirements

Document all existing modules and endpoints from Homework 3:

- `pets`,
- `shelters`,
- `tags`,
- `adopters`,
- adoption flow endpoints (adopt/return/history).

Use Swagger decorators so the generated docs are complete and readable.

### 1) Controller-level documentation

Each controller should have:

- a clear `@ApiTags(...)`,
- short route-level summaries and descriptions,
- optional grouping notes where helpful (for example: "Adoption flow").

### 2) Operation-level documentation

Each endpoint should include:

- `@ApiOperation(...)` with a clear summary,
- parameter docs for path/query params (`@ApiParam`, `@ApiQuery`),
- request-body docs (`@ApiBody`) where relevant,
- success response docs (`@ApiOkResponse`, `@ApiCreatedResponse`, `@ApiNoContentResponse`),
- error response docs (`@ApiBadRequestResponse`, `@ApiNotFoundResponse`, `@ApiConflictResponse` where applicable).

### 3) DTO/schema documentation

All request and response DTOs used by your API should be represented in schemas:

- decorate fields with `@ApiProperty(...)` / `@ApiPropertyOptional(...)`,
- include examples for important fields,
- include enum documentation where enums are used (`species`, `status`, etc.),
- make sure optional vs required fields are shown correctly,
- ensure nested objects/arrays are represented correctly (medical, tags, relation snippets, etc.).

### 4) Response behavior accuracy

Your docs must match real behavior:

- endpoints that return `201` should be documented as `201`,
- delete endpoints should show `204`,
- validation failures and bad ids should show 4xx responses,
- conflict scenarios (`already adopted`, duplicate unique values, etc.) should be documented with the chosen status code.

### 5) Filtering and query docs

Document all query filters that already exist in your API, including:

- species/status filters,
- shelter filter,
- tags filter,
- adopter filter,
- search queries (for example tag name search), if implemented.

For each query param, document type, optionality, and expected format (for example comma-separated tags).

---

## Rules and constraints

- No endpoint behavior changes.
- No domain model changes.
- No new business logic.
- No authentication implementation required (unless your Homework 3 already has it; if yes, document it in Swagger).
- Keep controllers thin as before; decorators should not move business logic into controllers.

---

## Manual verification checklist

Use this checklist before submission:

1. `GET /api/docs` opens Swagger UI without errors.
2. Every existing endpoint appears under the correct tag.
3. Every path parameter is documented with the correct type.
4. Every query filter is documented with correct type/format.
5. POST/PUT/PATCH endpoints show request schemas matching DTO validation rules.
6. Success responses (`200`, `201`, `204`) are documented correctly.
7. Error responses (`400`, `404`, `409` where applicable) are documented on relevant endpoints.
8. Enums and nested DTO fields are visible and understandable in schemas.
9. At least one endpoint per module can be executed successfully from Swagger UI.

---

## Submission

Submit the same project from Homework 3, now with Swagger docs added, plus:

- updated source code with Swagger decorators/configuration,
- one screenshot of `/api/docs` showing all API tags,
- brief README section: "Swagger notes" describing any assumptions or known documentation gaps.

---

## What we are looking for

- Documentation is complete for the whole existing API, not just a few endpoints.
- Schemas are derived from DTOs and are easy for another developer to consume.
- Status codes and error cases in docs match the real API behavior.
- The docs are clean, consistent, and useful as a contract for frontend or QA teams.
