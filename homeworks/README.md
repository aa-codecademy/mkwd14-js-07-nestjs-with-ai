# 📚 Homeworks — NestJS with AI

This folder collects all course homeworks. Each one builds on the previous lessons and expects you to apply only the concepts already covered in class.

> Keep each homework as a **separate Nest project** (e.g. `pet-adoption-api/`). If a nested `.git` appears inside it while you work in this course repo, delete it so you do not nest one Git repository inside another.

---

## 📋 List of homeworks

| #   | Homework                                                | Builds on lessons                                    | Topic                                                                       |
| --- | ------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| 1   | [Pet Adoption Center API](./HOMEWORK_1.md)              | `02_nest_intro` → `04_providers_di`                  | Modules, controllers, routing, services, dependency injection, in-memory state |
| 2   | [Pet Adoption Center API — DTOs & Validation](./HOMEWORK_2.md) | Homework 1 + `05_modules_structure` + `06_dtos_pipes` | DTOs, class-validator, class-transformer, global `ValidationPipe`, pipes    |

---

## 🎯 What each homework expects

### Homework 1 — Pet Adoption Center API

A first end-to-end Nest REST API. Focus on the basics:

- One module, one controller, one service
- Proper HTTP verbs and status codes
- Dependency injection through the constructor
- In-memory persistence (no DB)
- Postman collection with a manual test checklist

You will practice: **modules**, **controllers**, **routes**, **request body / params / query**, **services**, **DI**, **built-in exceptions** (`NotFoundException`, etc.).

### Homework 2 — Pet Adoption Center API + DTOs & Validation

Extends Homework 1 with the validation layer added in lesson `06_dtos_pipes`:

- Hand-crafted DTOs for create, update (PUT), partial update (PATCH)
- A reusable response DTO
- `class-validator` decorators for strings, numbers, booleans, enums, optional fields, nested objects, and arrays
- A global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`, and `enableImplicitConversion`
- Built-in pipes such as `ParseUUIDPipe` and `ParseEnumPipe` on route params and query strings
- Negative-test cases proving validation actually rejects bad input

You will practice: **DTOs**, **validation**, **transformation**, **pipes**, and **mapped-types** helpers (`PartialType`).

---

## 🧭 How to approach a homework

1. **Read the whole file once** before opening the editor.
2. **Sketch the URLs and JSON shapes** on paper or in a scratch file.
3. **Build the service first** so the controller stays thin.
4. **Test as you go** with Postman — do not wait until the end.
5. **Save your Postman collection** and commit it next to the source code.

---

## 📦 Submission

Unless your trainer says otherwise, every homework should include:

- The Nest project source (without `node_modules`)
- A Postman collection containing the requests you used while testing
- A short note in the project README listing anything you intentionally skipped or did differently
