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
