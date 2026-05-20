# NestJS — DTOs, Validation, Transformation, and Pipes (SEDC)

This lesson teaches how Nest validates and transforms incoming HTTP data before it ever reaches your business logic.

You will learn:

- What a **DTO** is and why we use one
- How **Pipes** plug into the request lifecycle
- How `ValidationPipe` works with `class-validator` and `class-transformer`
- How to validate **nested objects**, **arrays**, **optional fields**, and **partial updates**
- The difference between built-in pipes (`ParseIntPipe`, `ParseUUIDPipe`, …) and the validation pipe

---

## 1. The request lifecycle (where pipes live)

```
HTTP request
   │
   ▼
[ Middleware ]
   │
   ▼
[ Guards ]
   │
   ▼
[ Interceptors (pre) ]
   │
   ▼
[ Pipes ]  ← validation + transformation happens here
   │
   ▼
[ Route handler / Controller method ]
   │
   ▼
[ Interceptors (post) ]
   │
   ▼
[ Exception filters ]
   │
   ▼
HTTP response
```

Pipes are the **last gate** before your controller method runs. If validation fails, Nest throws a `BadRequestException` and your controller is never called.

---

## 2. What is a DTO?

A **Data Transfer Object (DTO)** is a class that describes the **shape of data crossing a boundary** — usually the HTTP boundary.

Two reasons we use a class (not an `interface`):

1. **Interfaces are erased at runtime.** TypeScript types disappear after compilation, so Nest cannot see them. A class survives compilation and can carry **decorators** (`@IsString`, `@IsEmail`, …) that `class-validator` reads at runtime.
2. **A single source of truth.** The same class is used for typing the body, validating it, and (optionally) generating Swagger docs.

### Naming convention used in this project

| File | Purpose |
|------|---------|
| `artist-create.dto.ts` | Body shape for `POST /artist` (create payload) |
| `artist-update.dto.ts` | Body shape for `PUT/PATCH /artist/:id` (full / partial) |
| `artist.dto.ts` | Server representation (`id` + create fields) — what the API returns |

This split makes intent obvious: a client cannot send `id`, the server assigns it.

---

## 3. Pipes — the two jobs

A pipe in Nest has **two responsibilities**:

1. **Transformation** — convert raw input into the type you want
   `"42"` (string from URL) → `42` (number)
2. **Validation** — reject input that doesn't satisfy the rules
   `"abc"` for an integer field → `400 Bad Request`

### Built-in pipes you should know

| Pipe | What it does |
|------|--------------|
| `ParseIntPipe` | `"42"` → `42`, fails on `"abc"` |
| `ParseFloatPipe` | `"3.14"` → `3.14` |
| `ParseBoolPipe` | `"true"`/`"1"` → `true` |
| `ParseUUIDPipe` | validates `:id` is a UUID v4 |
| `ParseArrayPipe` | parses comma-separated query strings |
| `ParseEnumPipe` | restricts a value to an enum |
| `DefaultValuePipe` | provides a fallback if value is missing |
| `ValidationPipe` | runs `class-validator` on a DTO instance |

Example:

```ts
@Get(':id')
getOne(@Param('id', ParseUUIDPipe) id: string) { ... }

@Get()
list(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
) { ... }
```

### Where pipes can be applied

| Scope | How | When to use |
|-------|-----|-------------|
| **Parameter** | `@Param('id', ParseIntPipe)` | One specific argument |
| **Method** | `@UsePipes(ValidationPipe)` on a handler | One endpoint |
| **Controller** | `@UsePipes(ValidationPipe)` on a class | All endpoints in that controller |
| **Global** | `app.useGlobalPipes(new ValidationPipe())` | The whole application — **what we do in this lesson** |

---

## 4. Global `ValidationPipe` configuration

In `main.ts` we register one pipe for the whole app:

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }),
);
```

| Option | What it does |
|--------|--------------|
| `whitelist: true` | **Strips** properties from the payload that have no validation decorator. Prevents clients from sneaking extra fields into your database. |
| `forbidNonWhitelisted: true` | Goes one step further — **rejects** the request (400) if it contains unknown fields. Great for strict APIs. |
| `transform: true` | Turns plain JSON into an actual instance of the DTO class (`req.body instanceof CreateUserDto === true`). Required for `@Type()` to work and for `enableImplicitConversion`. |
| `transformOptions.enableImplicitConversion: true` | Lets primitives auto-convert based on the TS type (`"25"` → `25` for a `number` field). Removes the need for `@Type(() => Number)` on basic types. |

### Whitelist in action

DTO:
```ts
class CreateUserDto { @IsString() name!: string; }
```

Client sends:
```json
{ "name": "Ana", "isAdmin": true }
```

| Setting | Result |
|---------|--------|
| no whitelist | `{ name: "Ana", isAdmin: true }` reaches the controller |
| `whitelist: true` | `{ name: "Ana" }` — `isAdmin` is silently dropped |
| `whitelist: true, forbidNonWhitelisted: true` | `400 Bad Request: property isAdmin should not exist` |

---

## 5. Validation with `class-validator`

`class-validator` is a third-party library that reads **decorators** at runtime to validate plain objects.

### Common decorators by category

**Strings**
`@IsString()` · `@IsEmail()` · `@IsUrl()` · `@IsUUID('4')` · `@Length(min, max)` · `@MinLength(n)` · `@Matches(/regex/)` · `@IsIn([...])`

**Numbers**
`@IsInt()` · `@IsNumber()` · `@IsPositive()` · `@Min(n)` · `@Max(n)`

**Booleans / dates**
`@IsBoolean()` · `@IsDate()` · `@IsISO8601()`

**Arrays**
`@IsArray()` · `@ArrayNotEmpty()` · `@ArrayMinSize(n)` · `@ArrayMaxSize(n)` · `@ArrayUnique()`
Combine with `{ each: true }` on item-level rules: `@IsString({ each: true })`

**Objects / nesting**
`@IsObject()` · `@ValidateNested()` (needs `@Type(() => ChildDto)`)

**Modifiers**
`@IsOptional()` — skip validators below if the value is `undefined`/`null`.

### Example used in this project

`src/artist/dto/artist-create.dto.ts`:

```ts
export class ArtistCreateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsIn(['rock', 'pop', 'jazz', 'hip-hop', 'classical', 'electronic'])
  genre!: string;

  @IsBoolean()
  isActive!: boolean;

  @ValidateNested()
  @Type(() => ArtistProfileDto)
  profile!: ArtistProfileDto;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  aliases?: string[];
}
```

Things worth pointing out for students:

- The `!` (`name!:`) is a **TypeScript** assertion that the field will be set; it has nothing to do with validation. We use it because we initialize nothing here — the data comes from the request.
- **Decorator order doesn't matter**, but reading them top-to-bottom helps humans.
- `{ each: true }` makes a validator apply to every element of an array.
- For nested objects you need **both** `@ValidateNested()` and `@Type(() => Child)`, otherwise `class-validator` doesn't know which class to instantiate for the inner object.

---

## 6. Transformation with `class-transformer`

`ValidationPipe` builds a class instance from the request JSON, but only when `transform: true`.

### Why transformation matters

Without `transform`:

```ts
@Body() body: CreateUserDto  // body is actually a plain object, not a class instance
```

With `transform: true`:

```ts
@Body() body: CreateUserDto  // body instanceof CreateUserDto === true
```

This is required for:

- Default values declared in the class to apply
- Methods on the DTO to be callable
- `@Type(() => Date)` and other type hints to do their job

### `@Type()` — telling class-transformer the runtime type

TypeScript types disappear at runtime. `class-transformer` needs explicit hints for non-primitive types:

```ts
@Type(() => Date)
@IsDate()
releaseDate?: Date;

@Type(() => AlbumEditionDto)
@ValidateNested({ each: true })
editions!: AlbumEditionDto[];
```

### `enableImplicitConversion`

Allows automatic primitive conversion **based on the TypeScript type**:

```ts
class Query {
  @IsInt() page!: number;     // "5" → 5 automatically
  @IsBoolean() active!: boolean; // "true" → true automatically
}
```

Useful for query strings and route params (always strings in HTTP).

---

## 7. Reusing DTOs with `@nestjs/mapped-types`

For PATCH endpoints we usually accept "any subset" of the create fields. Instead of writing a second DTO by hand, derive one:

```ts
import { PartialType } from '@nestjs/mapped-types';
import { ArtistCreateDto } from './artist-create.dto';

export class ArtistPartialUpdateDto extends PartialType(ArtistCreateDto) {}
```

`PartialType` produces a new class where every property becomes optional but **keeps all the validation decorators**.

Other helpers:

| Helper | What it does |
|--------|--------------|
| `PartialType(X)` | every field becomes optional |
| `PickType(X, ['name','email'])` | only the listed fields |
| `OmitType(X, ['password'])` | every field except the listed ones |
| `IntersectionType(A, B)` | merges two DTOs |

These keep your validation rules DRY.

---

## 8. Error responses

When validation fails the global pipe returns something like:

```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "genre must be one of: rock, pop, ..."
  ],
  "error": "Bad Request"
}
```

`message` is an **array** — one entry per violated rule. This is perfect for showing inline errors in a frontend form.

You can customize the response with `exceptionFactory`:

```ts
new ValidationPipe({
  exceptionFactory: (errors) =>
    new BadRequestException({
      message: 'Invalid payload',
      details: errors,
    }),
});
```

---

## 9. Writing a custom pipe (optional, for the curious)

Pipes implement the `PipeTransform` interface:

```ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class TrimPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('Expected string');
    }
    return value.trim();
  }
}
```

Use it: `@Param('name', TrimPipe) name: string`.

Custom pipes are the right tool when neither `ValidationPipe` nor a built-in `Parse*Pipe` fits — for example, parsing custom IDs, decoding base64, or normalizing input.

---

## 10. Folder map for this lesson

| File | What to study |
|------|---------------|
| `src/main.ts` | Global `ValidationPipe` setup |
| `src/artist/dto/artist-create.dto.ts` | Strings, enums, arrays, optional, nested validation |
| `src/artist/dto/artist-update.dto.ts` | `PartialType` for PATCH |
| `src/artist/dto/artist.dto.ts` | Extending a create DTO with `id` for responses |
| `src/song/dto/song-create.dto.ts` | Array of UUIDs, integer ranges, default values |
| `src/album/dto/album-create.dto.ts` | Nested array of objects with `@Type` + `@ValidateNested` |
| `src/artist/artist.controller.ts` | `@Body`, `@Param`, `@Query` with DTOs |
| `src/album/album.controller.ts` | Example of per-controller `@UsePipes` (commented) |

---

## 11. Try it yourself

Run the app:

```bash
npm install
npm run start:dev
```

Then poke the API and watch validation errors come back:

```bash
# missing required field
curl -X POST localhost:3000/artist \
  -H "Content-Type: application/json" \
  -d '{}'

# wrong genre
curl -X POST localhost:3000/artist \
  -H "Content-Type: application/json" \
  -d '{ "name": "X", "genre": "metal", "isActive": true, "profile": { "country": "MK" } }'

# extra field (forbidNonWhitelisted)
curl -X POST localhost:3000/artist \
  -H "Content-Type: application/json" \
  -d '{ "name": "X", "genre": "rock", "isActive": true, "profile": { "country": "MK" }, "evil": "field" }'
```

A complete Postman collection is also included: `SEDC_2026_Nest.postman_collection.json`.

---

## 12. Exercises

1. Add a `@IsHexColor()` field `themeColor` to `ArtistCreateDto` and make it optional.
2. Use `PickType` to build a `ArtistRenameDto` that only contains `name`.
3. Replace `@Param('id') id: string` with `@Param('id', ParseUUIDPipe) id: string` everywhere and observe the new error messages.
4. Write a custom `LowercasePipe` and use it on the `genre` query parameter in `GET /artist/search`.
5. Add a custom `exceptionFactory` so all validation errors return a `{ field, message }` shape.

---

## Further reading

- [Pipes | NestJS](https://docs.nestjs.com/pipes)
- [Validation | NestJS](https://docs.nestjs.com/techniques/validation)
- [Mapped types | NestJS](https://docs.nestjs.com/openapi/mapped-types)
- [class-validator](https://github.com/typestack/class-validator#validation-decorators) — full decorator reference
- [class-transformer](https://github.com/typestack/class-transformer)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
