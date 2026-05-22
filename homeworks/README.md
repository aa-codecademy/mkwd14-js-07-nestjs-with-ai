# 📚 Homeworks — NestJS with AI

This folder collects all course homeworks. Each one builds on the previous lessons and expects you to apply only the concepts already covered in class.

> Keep each homework as a **separate Nest project** (e.g. `pet-adoption-api/`). If a nested `.git` appears inside it while you work in this course repo, delete it so you do not nest one Git repository inside another.

---

## 📋 List of homeworks

| #   | Homework                                                         | Builds on lessons                                     | Topic                                                                                                                          |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | [Pet Adoption Center API](./HOMEWORK_1.md)                       | `02_nest_intro` → `04_providers_di`                   | Modules, controllers, routing, services, dependency injection, in-memory state                                                 |
| 2   | [Pet Adoption Center API — DTOs & Validation](./HOMEWORK_2.md)   | Homework 1 + `05_modules_structure` + `06_dtos_pipes` | DTOs, class-validator, class-transformer, global `ValidationPipe`, pipes                                                       |
| 3   | [Pet Adoption Center API — TypeORM & Relations](./HOMEWORK_3.md) | Homework 2 + `07_typeorm`                             | PostgreSQL, TypeORM entities & repositories, `@OneToOne` / `@OneToMany` / `@ManyToOne` / `@ManyToMany`, cascades, transactions |

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

### Homework 3 — Pet Adoption Center API + TypeORM & Relations

Replaces the in-memory store with a real **PostgreSQL** database via TypeORM and grows the model into a small graph using every relation type from lesson `07_typeorm`:

- Pets persisted as TypeORM entities with `@PrimaryGeneratedColumn('uuid')` and audit columns
- New entities for **Shelter**, **MedicalRecord**, **Tag**, **Adopter**, and **Adoption**
- All four relation styles: `@OneToOne` (Pet ↔ MedicalRecord), `@OneToMany` / `@ManyToOne` (Pet ↔ Shelter), `@ManyToMany` (Pet ↔ Tag)\*, and an explicit join entity (Pet ↔ Adopter via `Adoption`)
- Cross-entity validation, cascades, and conflict handling (404s for missing related ids, 409s for duplicates and adoption conflicts)
- Transactional adopt / return flow that updates the pet **and** the adoption record atomically\*
- Endpoints that return the related graph eagerly (a pet response includes its shelter, medical record, tags, and current adoption)

You will practice: **TypeORM entities**, **`Repository<T>`**, **relations**, **eager vs lazy loading**, **cascades**, **transactions**, and modeling a real domain across multiple modules.

Requirements marked with asterisk `*` can be done after we learn about those topics. Feel free to start with what you know at this moment, there are multiple requirements and this homework should take some time for you to complete it.

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
