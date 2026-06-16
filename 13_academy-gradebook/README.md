# Academy Grading — NestJS + MongoDB + Mongoose

A REST API for managing academy classes, students, homework, and grades.
Built with NestJS, MongoDB, and Mongoose, using the code-first schema approach.

---

## Table of Contents

1. [Installed Packages](#installed-packages)
2. [Commands](#commands)
3. [MongoDB Concepts](#mongodb-concepts)
4. [Mongoose](#mongoose)
5. [Mongoose in NestJS (`@nestjs/mongoose`)](#mongoose-in-nestjs-nestjsmongoose)
6. [Schemas: Code-First with Decorators](#schemas-code-first-with-decorators)
7. [The `HydratedDocument` Type](#the-hydrateddocument-type)
8. [Injecting Models into Services](#injecting-models-into-services)
9. [Common Model Methods](#common-model-methods)
10. [Referencing Other Collections (ObjectId refs)](#referencing-other-collections-objectid-refs)
11. [ValidationPipe and DTOs](#validationpipe-and-dtos)
12. [Interceptors](#interceptors)
13. [Pipes](#pipes)
14. [Project Structure](#project-structure)

---

## Installed Packages

### Runtime Dependencies

| Package | Purpose |
| --- | --- |
| `@nestjs/common` | Core NestJS decorators, pipes, interceptors, guards, exceptions |
| `@nestjs/core` | NestJS application factory and DI container |
| `@nestjs/platform-express` | Express HTTP adapter (default platform) |
| `@nestjs/config` | `.env` file loading and `ConfigService` integration |
| `@nestjs/mongoose` | NestJS integration for Mongoose — `MongooseModule`, `@InjectModel`, `@Schema`, `@Prop`, `ParseObjectIdPipe` |
| `@nestjs/swagger` | OpenAPI spec generation from decorators; serves interactive docs at `/docs` |
| `mongoose` | MongoDB ODM — schemas, models, queries, validation, population |
| `class-validator` | Decorator-based validation for DTO classes (`@IsString`, `@IsEmail`, etc.) |
| `class-transformer` | Plain object ↔ class instance transformation (used by `ValidationPipe`) |
| `rxjs` | Reactive streams — used internally by NestJS for the interceptor pipeline |
| `reflect-metadata` | Required for TypeScript decorator metadata (used by all NestJS decorators) |

### Dev Dependencies

| Package | Purpose |
| --- | --- |
| `@nestjs/cli` | `nest` CLI — generate modules/services/controllers, build, watch |
| `@nestjs/schematics` | Code generation templates used by the CLI |
| `@nestjs/testing` | Testing utilities (`Test.createTestingModule`) |
| `typescript` | TypeScript compiler |
| `ts-node` | Run TypeScript files directly without pre-compiling |
| `ts-jest` | Jest transformer for TypeScript test files |
| `jest` | Test runner |
| `supertest` | HTTP assertion library for e2e tests |
| `eslint` + `prettier` | Linting and formatting |
| `@types/*` | Type definitions for Node, Express, Jest |

---

## Commands

```bash
# Install dependencies
npm install

# Development (watch mode — restarts on file changes)
npm run start:dev

# Production build
npm run build

# Run production build
npm run start:prod

# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Test coverage report
npm run test:cov

# Lint and auto-fix
npm run lint

# Format code with Prettier
npm run format
```

### NestJS CLI — Generate Resources

```bash
# Generate a complete resource (module + controller + service + DTOs)
nest generate resource <name>
# shorthand
nest g res <name>

# Generate individual pieces
nest g module <name>
nest g controller <name>
nest g service <name>
nest g interceptor common/interceptors/<name>
nest g pipe common/pipes/<name>
nest g guard common/guards/<name>
```

---

## MongoDB Concepts

MongoDB is a **document database**. Instead of tables and rows it stores data as
**collections** of **documents** — JSON-like objects (BSON internally) that can have
nested fields and arrays without a fixed schema.

### Key Terms

| Term | SQL Equivalent | Description |
| --- | --- | --- |
| Database | Database | Logical group of collections |
| Collection | Table | Group of related documents |
| Document | Row | A single JSON-like record |
| Field | Column | A key-value pair inside a document |
| `_id` | Primary key | Unique identifier — auto-generated as an ObjectId |
| ObjectId | UUID / serial | 12-byte unique identifier encoded as 24-char hex |
| Index | Index | Speeds up queries; unique indexes enforce uniqueness |
| Embedded document | — | A sub-object stored inside a parent document (no JOIN needed) |
| Reference | Foreign key | An ObjectId that points to a document in another collection |

### Document Example

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane.doe@example.com",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Embedding vs Referencing

**Embed** data when it is only ever read/written together with the parent (e.g. an
address inside a user document). Keeps reads fast — one query, no joins.

**Reference** with ObjectIds when the referenced data has its own lifecycle or is shared
by multiple documents (e.g. a homework referenced by many grades). Requires `.populate()`
to resolve the reference but avoids data duplication.

---

## Mongoose

Mongoose is an **Object Document Mapper (ODM)** for MongoDB and Node.js. It provides:

- **Schema definitions** — enforce structure and types on collections that MongoDB itself
  treats as schema-less.
- **Model** — a class bound to a collection that provides static query methods
  (`find`, `create`, `findOneAndDelete`, etc.).
- **Document** — a single record returned from a query; has Mongoose methods like
  `save()`, `toObject()`, `populate()`.
- **Validators** — `required`, `min`, `max`, `enum`, `unique`, `trim`, `lowercase`, etc.
  applied before any write reaches MongoDB.
- **Middleware (hooks)** — `pre`/`post` hooks on `save`, `find`, `remove`, etc.
- **Population** — resolves ObjectId references into the full document they point to,
  similar to a SQL JOIN.

### Mongoose vs Raw MongoDB Driver

The raw `mongodb` Node.js driver is faster and gives you full control, but you manage
typing, validation, and transformation yourself. Mongoose trades a small performance
overhead for a much better developer experience: typed schemas, built-in validation,
and population.

---

## Mongoose in NestJS (`@nestjs/mongoose`)

`@nestjs/mongoose` wraps Mongoose in NestJS's dependency injection system. The
integration has three main parts:

### 1. Root Connection — `MongooseModule.forRootAsync()`

Set up once in `AppModule`. Establishes the shared MongoDB connection for the whole app.

```typescript
// src/app.module.ts
MongooseModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.getOrThrow<string>('MONGO_URI'),
  }),
}),
```

`forRootAsync` is required here because the URI comes from `ConfigService`, which must
be resolved by the DI container first. `getOrThrow` fails fast at startup if the env
var is missing.

### 2. Feature Models — `MongooseModule.forFeature()`

Register Mongoose models inside feature modules. Each model is scoped to the module
that declares it and can be injected into that module's providers.

```typescript
// src/students/students.module.ts
MongooseModule.forFeature([
  { name: Student.name, schema: StudentSchema },
])
```

`Student.name` is the string `'Student'`. Mongoose uses this as the model name and
pluralises it to `'students'` as the collection name.

### 3. Model Injection — `@InjectModel()`

Inside a service, inject the Mongoose model using the `@InjectModel` decorator:

```typescript
// src/students/students.service.ts
constructor(
  @InjectModel(Student.name)
  private readonly studentModel: Model<StudentDocument>,
) {}
```

`Model<StudentDocument>` gives you full TypeScript typing for all Mongoose static
methods as well as your own schema fields.

---

## Schemas: Code-First with Decorators

`@nestjs/mongoose` lets you define MongoDB schemas as TypeScript classes using
decorators instead of writing the raw Mongoose schema object.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })      // enables createdAt / updatedAt
export class Student {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true, lowercase: true, unique: true })
  email!: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
//                           compiles @Prop decorators into a real Mongoose Schema
```

### Common `@Prop()` Options

| Option | Effect |
| --- | --- |
| `required: true` | Mongoose validator — rejects saves without this field |
| `unique: true` | Creates a MongoDB unique index — duplicates throw E11000 |
| `trim: true` | Strips leading/trailing whitespace before saving |
| `lowercase: true` | Converts value to lowercase before saving |
| `uppercase: true` | Converts value to uppercase before saving |
| `enum: MyEnum` | Restricts value to enum members |
| `min: n` / `max: n` | Numeric range validator |
| `minlength` / `maxlength` | String length validators |
| `default: value` | Default value when field is absent |
| `type: Types.ObjectId` | Stores as an ObjectId (required for references) |
| `ref: 'ModelName'` | Names the collection for `.populate()` |
| `index: true` | Creates a regular (non-unique) index |

### `@Schema()` Options

| Option | Effect |
| --- | --- |
| `timestamps: true` | Adds `createdAt` and `updatedAt` (managed by Mongoose) |
| `versionKey: false` | Disables the `__v` field |
| `collection: 'name'` | Override the auto-derived collection name |
| `strict: false` | Allow fields not declared in the schema |

---

## The `HydratedDocument` Type

```typescript
export type ClassDocument = HydratedDocument<Class>;
```

`HydratedDocument<T>` is Mongoose's TypeScript type for a **fully instantiated
document** — i.e. a document that has been fetched from the database or created via
`Model.create()`. It is `T & Document`, meaning it has:

- All properties declared on your schema class (`T`)
- Mongoose document methods: `save()`, `remove()`, `toObject()`, `toJSON()`, `populate()`
- Automatically added fields: `_id` (ObjectId), `__v` (version key), `createdAt`,
  `updatedAt` (when `timestamps: true`)

Use `ClassDocument` (instead of plain `Class`) as return types in services so
consumers get full IntelliSense on both your fields and Mongoose internals.

---

## Injecting Models into Services

```typescript
@Injectable()
export class ClassesService {
  // The DI token must match the name used in MongooseModule.forFeature()
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
  ) {}

  create(dto: CreateClassDto): Promise<ClassDocument> {
    return this.classModel.create(dto);
  }

  findAll(): Promise<ClassDocument[]> {
    return this.classModel.find();
  }

  remove(id: string) {
    return this.classModel.findOneAndDelete({ _id: id });
  }
}
```

---

## Common Model Methods

| Method | Description |
| --- | --- |
| `Model.create(doc)` | Insert a new document; runs validators; returns the saved document |
| `Model.find(filter?)` | Return all matching documents (array) |
| `Model.findOne(filter)` | Return the first matching document or `null` |
| `Model.findById(id)` | Shorthand for `findOne({ _id: id })` |
| `Model.findOneAndUpdate(filter, update, opts)` | Find, update, and return the document |
| `Model.findOneAndDelete(filter)` | Find, delete, and return the deleted document |
| `Model.updateMany(filter, update)` | Update all matching documents |
| `Model.deleteMany(filter)` | Delete all matching documents |
| `Model.countDocuments(filter)` | Count matching documents |
| `Model.aggregate(pipeline)` | Run a MongoDB aggregation pipeline |
| `Model.populate(docs, path)` | Populate references on already-fetched documents |

### Chaining Query Options

```typescript
// Sort, skip, limit, select — chain before awaiting
const students = await this.studentModel
  .find()
  .sort({ lastName: 1 })
  .skip(0)
  .limit(20)
  .select('firstName lastName email');    // only return these fields
```

### Populate (resolving references)

```typescript
// Fetch a homework and replace the 'class' ObjectId with the full Class document
const homework = await this.homeworkModel
  .findById(id)
  .populate('class');
// homework.class is now a full Class document, not just an ObjectId
```

---

## Referencing Other Collections (ObjectId refs)

To create a reference between collections, store the `_id` of the target document
as an `ObjectId` field and name the target model in `ref`:

```typescript
// grade.schema.ts
@Prop({ type: Types.ObjectId, ref: 'Student', required: true })
student!: Types.ObjectId;

@Prop({ type: Types.ObjectId, ref: 'Homework', required: true })
homework!: Types.ObjectId;
```

- `type: Types.ObjectId` — tells Mongoose the stored type is an ObjectId, not a string.
- `ref: 'Student'` — names the model that `.populate('student')` should load.

Without `ref`, Mongoose stores the ObjectId but has no idea which collection to load
when you call `.populate()`.

---

## ValidationPipe and DTOs

NestJS uses **DTOs** (Data Transfer Objects) to define the shape of incoming request
bodies, and **`ValidationPipe`** to enforce those shapes automatically.

### How It Works

```text
Incoming HTTP request body (JSON string)
  ↓  class-transformer: parse & instantiate DTO class
  ↓  class-validator: run @Is* decorator validators
  ↓  if invalid → 400 BadRequest (automatic)
  ↓  if valid → controller method receives typed DTO instance
```

### Global Configuration (`main.ts`)

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // strip unknown properties from the body
    forbidNonWhitelisted: true,   // reject requests with unknown properties (400)
    transform: true,              // convert plain JSON to DTO class instances
    transformOptions: {
      enableImplicitConversion: true,  // auto-convert types (string → number, etc.)
    },
  }),
);
```

### DTO Example

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(2)
  firstName!: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;
}
```

### Common `class-validator` Decorators

| Decorator | Validates |
| --- | --- |
| `@IsString()` | Value is a string |
| `@IsNumber()` | Value is a number |
| `@IsBoolean()` | Value is a boolean |
| `@IsEmail()` | Value is a valid email |
| `@IsUrl()` | Value is a valid URL |
| `@IsEnum(MyEnum)` | Value is a member of the enum |
| `@IsOptional()` | Field may be absent (skips other validators if missing) |
| `@IsNotEmpty()` | String is not empty |
| `@MinLength(n)` / `@MaxLength(n)` | String length bounds |
| `@Min(n)` / `@Max(n)` | Numeric range |
| `@IsArray()` | Value is an array |
| `@ValidateNested()` | Recursively validate nested objects |
| `@Type(() => SubDto)` | Required with `ValidateNested` to instantiate nested DTO |
| `@IsPhoneNumber('MK')` | Valid phone number for the given country |

---

## Interceptors

An interceptor is a class decorated with `@Injectable()` that implements
`NestInterceptor`. It sits in the request/response pipeline and can:

- Execute logic **before** the route handler runs
- Execute logic **after** the route handler runs (via the returned Observable)
- Transform the response
- Override thrown exceptions
- Extend basic function behavior (caching, logging, timing)

### Execution Order

```text
Client Request
  → Middleware
  → Guards
  → Interceptor (before — runs synchronously up to next.handle())
  → Pipes
  → Controller / Route Handler
  → Interceptor (after — the Observable returned by next.handle() emits)
  → Response sent to client
  → Exception Filters (if an error was thrown anywhere above)
```

### Interface

```typescript
export interface NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
```

- `context: ExecutionContext` — metadata about the current request.
  Use `context.switchToHttp()` to get the Express `Request` / `Response` objects.
- `next: CallHandler` — a handle to the rest of the pipeline.
  Call `next.handle()` to proceed to the route handler; it returns an `Observable`.

### Logging Interceptor (this project)

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      // tap() fires after the handler completes — response is ready, status code is set
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} ${res.statusCode} - ${ms}ms`);
      }),
    );
  }
}
```

### Registering Interceptors

```typescript
// Global — all routes (main.ts)
app.useGlobalInterceptors(new LoggingInterceptor());

// Controller-level — all routes in this controller
@UseInterceptors(LoggingInterceptor)
@Controller('students')
export class StudentsController {}

// Route-level — single route only
@UseInterceptors(LoggingInterceptor)
@Get()
findAll() {}
```

### Common Interceptor Use Cases

| Use Case | Approach |
| --- | --- |
| Request/response logging | `tap()` after `next.handle()` — see LoggingInterceptor in this project |
| Response transformation | `map()` after `next.handle()` to wrap response in `{ data: ... }` |
| Hide sensitive fields | Use `ClassSerializerInterceptor` with `@Exclude()` on DTO properties |
| Caching | Return cached value instead of calling `next.handle()` |
| Request timeout | `timeout(5000)` on the Observable from `next.handle()` |
| Exception mapping | `catchError()` on the Observable from `next.handle()` |

---

## Pipes

A pipe is a class that implements `PipeTransform`. It runs **after guards and before the
route handler** and has two responsibilities:

1. **Transformation** — convert input data to the desired type/shape
2. **Validation** — validate the data; throw an exception if it is invalid

### Built-in Pipes

| Pipe | Description |
| --- | --- |
| `ValidationPipe` | Validates DTOs using `class-validator` decorators |
| `ParseIntPipe` | Parses a string to `number` (integer); 400 if it fails |
| `ParseFloatPipe` | Parses a string to `number` (float) |
| `ParseBoolPipe` | Parses `'true'`/`'false'` to `boolean` |
| `ParseUUIDPipe` | Validates a string is a valid UUID |
| `ParseArrayPipe` | Parses a comma-separated string into an array |
| `ParseEnumPipe` | Validates a string is a member of an enum |
| `DefaultValuePipe` | Provides a default value when the input is `undefined` |
| `ParseObjectIdPipe` | Validates a string is a valid MongoDB ObjectId (from `@nestjs/mongoose`) |

### `ParseObjectIdPipe` — Used in This Project

```typescript
// classes.controller.ts / students.controller.ts
@Delete(':id')
async remove(@Param('id', ParseObjectIdPipe) id: string): Promise<void> {
  await this.classesService.remove(id);
}
```

Without this pipe, a request like `DELETE /api/classes/not-a-valid-id` would reach
the service and cause a Mongoose CastError deep in the stack. `ParseObjectIdPipe`
catches the invalid format early and returns a clean 400 Bad Request response.

### Custom Pipe Example

```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParsePositiveIntPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const n = parseInt(value, 10);
    if (isNaN(n) || n <= 0) {
      throw new BadRequestException('Value must be a positive integer');
    }
    return n;
  }
}
```

### Pipe Scope

```typescript
// Global (main.ts)
app.useGlobalPipes(new ValidationPipe({ ... }));

// Controller-level
@UsePipes(new ValidationPipe())
@Controller('students')

// Route-level
@Get(':id')
findOne(@Param('id', ParseObjectIdPipe) id: string) {}

// Param-level (most common for param parsing pipes)
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {}
```

---

## Project Structure

```text
academy-grading/
├── src/
│   ├── main.ts                          # Bootstrap: pipes, interceptors, Swagger
│   ├── app.module.ts                    # Root module: DB connection, feature modules
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── common/
│   │   └── interceptors/
│   │       └── logging.interceptor.ts   # Logs method/URL/status/duration per request
│   │
│   ├── classes/
│   │   ├── schemas/class.schema.ts      # @Schema + @Prop → Mongoose schema
│   │   ├── types/class.ts               # ClassName enum (allowed class names)
│   │   ├── dto/create-class.dto.ts      # Validated request body shape
│   │   ├── classes.module.ts            # MongooseModule.forFeature registration
│   │   ├── classes.service.ts           # @InjectModel + Mongoose queries
│   │   └── classes.controller.ts        # HTTP routes
│   │
│   ├── students/
│   │   ├── schemas/student.schema.ts    # unique + lowercase email index
│   │   ├── dto/create-student.dto.ts    # @IsEmail, @IsPhoneNumber validation
│   │   ├── students.module.ts
│   │   ├── students.service.ts          # Duplicate email check → ConflictException
│   │   └── students.controller.ts
│   │
│   ├── homeworks/
│   │   ├── schemas/homework.schema.ts   # References Class via ObjectId + ref
│   │   ├── dto/create-homework.dto.ts   # @IsMongoId validates class reference format
│   │   ├── homeworks.module.ts          # Imports ClassesModule for cross-module DI
│   │   ├── homeworks.service.ts         # Validates class exists; uses .populate()
│   │   └── homeworks.controller.ts      # GET /class/:id sub-resource route
│   │
│   └── grades/
│       ├── schemas/grade.schema.ts      # References Student + Homework via ObjectId
│       ├── dto/create-grade.dto.ts      # Dual validation: DTO + schema min/max
│       ├── grades.module.ts             # Imports StudentsModule + HomeworksModule
│       ├── grades.service.ts            # Validates both refs; prevents duplicates
│       └── grades.controller.ts         # Implemented + stub endpoints for exercises
│
├── public/                              # Static files served at root URL
├── test/                                # E2E tests
├── .env                                 # MONGO_URI=mongodb://...
└── package.json
```

### Data Model Relationships

```text
Class ──< Homework ──< Grade >── Student
```

- A **Class** has many **Homeworks** (Homework stores a `class` ObjectId)
- A **Homework** has many **Grades** (Grade stores a `homework` ObjectId)
- A **Student** has many **Grades** (Grade stores a `student` ObjectId)

### Cross-Module Dependencies

NestJS modules are isolated by default — a service from one module cannot be injected
into another unless it is explicitly exported and the consumer imports the module.

```text
GradesModule
  imports StudentsModule  → injects StudentsService  (verify student exists)
  imports HomeworksModule → injects HomeworksService (verify homework exists)

HomeworksModule
  imports ClassesModule   → injects ClassesService   (verify class exists)
```

This is how the application enforces referential integrity without foreign key
constraints — at the application layer, before any DB write.

---

## API Endpoints

All routes are prefixed with `/api`. Visit `/docs` for the interactive Swagger UI.

### Classes

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/classes` | Create a new class (name must match `ClassName` enum) |
| `GET` | `/api/classes` | Return all classes |
| `DELETE` | `/api/classes/:id` | Delete a class by MongoDB ObjectId |

### Students

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/students` | Create a student (email must be unique) |
| `GET` | `/api/students` | Return all students |
| `GET` | `/api/students/:id` | Return one student by ID |
| `DELETE` | `/api/students/:id` | Delete a student by ID |

### Homeworks

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/homeworks` | Create a homework (validates class exists; returns with class populated) |
| `GET` | `/api/homeworks` | Return all homeworks sorted newest-first (class populated) |
| `GET` | `/api/homeworks/class/:id` | Return all homeworks for a specific class |
| `DELETE` | `/api/homeworks/:id` | Delete a homework (returns 204 No Content) |

### Grades

| Method | Path | Description | Status |
| --- | --- | --- | --- |
| `POST` | `/api/grades` | Create a grade (validates student + homework; prevents duplicates) | ✅ Implemented |
| `GET` | `/api/grades` | Return all grades (student + homework populated) | ✅ Implemented |
| `GET` | `/api/grades/student/:id` | Return all grades for a student | 🔧 Exercise |
| `GET` | `/api/grades/homework/:id` | Return all grades for a homework | 🔧 Exercise |
| `GET` | `/api/grades/student/:id/average` | Return a student's average grade | 🔧 Exercise |
| `DELETE` | `/api/grades/:id` | Delete a grade by ID | 🔧 Exercise |

---

## Student Exercises

The following endpoints are stubbed in `grades.controller.ts` and need to be implemented
in `grades.service.ts`. Each builds on patterns already used in the codebase.

### Exercise 1 — `findByStudent(id)`

Filter grades by `{ student: id }` and populate the `homework` field.
Use `ParseObjectIdPipe` on the `:id` param (see `homeworks.controller.ts` for reference).

### Exercise 2 — `findByHomework(id)`

Filter grades by `{ homework: id }` and populate the `student` field.

### Exercise 3 — `averageForStudent(id)`

Calculate the mean `value` across all grades for a student. Two approaches:

- **JavaScript**: fetch all grades with `findByStudent`, then use `Array.reduce()`.
- **MongoDB aggregation**: use `gradeModel.aggregate()` with `$match` + `$group` + `$avg`.

### Exercise 4 — `remove(id)`

Replace the placeholder string return in `grades.service.ts` with a real
`gradeModel.findByIdAndDelete(id)` call (see `homeworks.service.ts` for reference).

---

### Environment Variables (`.env`)

```env
MONGO_URI=mongodb://localhost:27017/academy-grading
PORT=3000
```

### API Documentation

Once the server is running, visit:

- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI JSON**: [http://localhost:3000/docs-json](http://localhost:3000/docs-json)
