---
applyTo: '**/src/**/dto/*.dto.ts'
---

# DTO conventions

DTOs define and validate request shapes. The global `ValidationPipe`
(`whitelist`, `forbidNonWhitelisted`, `transform`) strips unknown fields and rejects extras,
so every accepted property **must** be declared here.

- Name: `create-<entity>.dto.ts` → `CreateEntityDto`, `update-<entity>.dto.ts` → `UpdateEntityDto`.
- Build update DTOs from create DTOs with `PartialType(CreateEntityDto)` from `@nestjs/swagger`.
- Every field carries:
  - a `class-validator` decorator (`@IsString`, `@IsEmail`, `@MinLength`, `@IsInt`, `@Min`, `@Max`,
    `@IsMongoId`, `@IsOptional`, …), and
  - an `@ApiProperty({ example: ... })` (use `@ApiPropertyOptional` for optional fields) so Swagger
    shows realistic examples.
- Mark fields with `!` (definite assignment): `email!: string;`.
- Validate referenced ids with `@IsMongoId()`. Constrain numbers with `@Min`/`@Max`
  (e.g. grade `value` is 1–10).
- DTOs hold no methods or logic — declarations only.
