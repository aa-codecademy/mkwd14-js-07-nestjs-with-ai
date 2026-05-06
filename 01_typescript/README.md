# 01 TypeScript Fundamentals

This class introduces the TypeScript fundamentals needed before starting with NestJS.

## What was learned

- TypeScript primitive types (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`)
- Special types and return types (`any`, `unknown`, `void`, `never`)
- Arrays, union types in arrays, readonly arrays, and tuples
- Object typing with `interface` and `type`
- Optional properties and strict shape checking with `satisfies`
- Union types and discriminated unions
- Enums and enum alternatives with string unions
- Generic functions and generic interfaces
- Type narrowing using runtime checks (`in`, `typeof`)
- Class fundamentals: access modifiers, abstract classes, inheritance, static members

## Core theory

### Why TypeScript

TypeScript is JavaScript with a static type system.
Types are checked at development time, which helps catch bugs early, improve autocomplete, and make refactoring safer.
After compilation, TypeScript produces plain JavaScript that runs in Node.js or the browser.

### 1) Primitive and special types

- Primitive types (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`, `bigint`) model basic values.
- `void` is used for functions that do not return a meaningful value.
- `never` is used for functions that never successfully finish (for example, they always throw).
- `any` disables type safety and should be avoided in most code.
- `unknown` is a safer alternative to `any` because it requires runtime checks before usage.

### 2) Arrays and tuples

- `T[]` and `Array<T>` are equivalent ways to type arrays.
- Union arrays (for example `(string | number)[]`) allow multiple element types in one collection.
- `readonly` arrays prevent mutation (`push`, `pop`, etc.).
- Tuples represent fixed-length arrays with position-based types, useful when each index has a specific meaning.

### 3) Objects with interfaces and type aliases

- `interface` is ideal for object contracts and extension (`extends`).
- `type` is more flexible for unions, intersections, and aliases of primitives or objects.
- Optional properties (`prop?: T`) model data that may or may not exist.
- `satisfies` validates object shape against a contract while preserving precise inferred types.

### 4) Unions and discriminated unions

- Union types (`A | B`) express values that can be one of several shapes.
- Discriminated unions use a shared literal field (for example `type: 'circle' | 'square'`) to safely branch logic.
- They are a strong pattern for API responses, command handling, and state machines.

### 5) Enums and string-literal alternatives

- `enum` can represent named constants, but runtime output and numeric mapping should be understood.
- String enums are usually safer than numeric enums for external communication.
- Literal unions (for example `'NORTH' | 'SOUTH'`) are a lightweight alternative with strong type safety.

### 6) Generics

- Generics let us write reusable code while preserving exact types.
- A generic function like `findOne<T>` keeps input and output types connected.
- Generic interfaces (for example paginated responses) let us reuse a shared structure for many payload types.

### 7) Type narrowing

- Narrowing is the process of making a broad type more specific using runtime checks.
- Common checks: `typeof`, `'property' in object`, equality checks, and custom type guards.
- Narrowing is required before using members that exist only on one branch of a union type.

### 8) Classes and OOP fundamentals

- `public`, `private`, and `protected` control visibility and encapsulation.
- `abstract` classes define shared behavior and required methods for subclasses.
- Inheritance allows code reuse and shared contracts.
- `static` members belong to the class itself, not to individual instances.

### How this connects to NestJS

NestJS is heavily TypeScript-first:

- DTOs rely on clear object typing.
- Dependency Injection depends on classes and metadata.
- Guards/interceptors/filters use class-based patterns.
- Generic and union types improve API contracts and service abstractions.

## Files in this lesson

- `src/01-primitives.ts` - primitive and special types
- `src/02-arrays.ts` - arrays, readonly arrays, tuples
- `src/03-objects.ts` - interfaces, types, unions, enums
- `src/04-generics.ts` - generic functions and generic interfaces
- `src/05-type-narrowing.ts` - narrowing union types safely
- `src/06-classes.ts` - classes, modifiers, abstract classes, static members
- `src/index.ts` - lesson entry point

## Run the examples

From this folder:

```bash
npm install
npm run dev
```

Build compiled JavaScript:

```bash
npm run build
npm run start
```
