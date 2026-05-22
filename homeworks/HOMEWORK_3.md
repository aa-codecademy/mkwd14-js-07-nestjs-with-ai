# Homework 3 — Pet Adoption Center API + TypeORM & Relations

Extend your **Homework 2** Pet Adoption API by replacing the in-memory store with a real **PostgreSQL** database through **TypeORM**, and grow the model with proper **relations** (`@OneToOne`, `@OneToMany` / `@ManyToOne`, `@ManyToMany`).

The validation, DTOs, and HTTP behaviour you already built stay the same. The big difference is that the shelter is no longer a single list of pets — it is a small graph: pets live in **shelters**, are described by **tags**, carry a dedicated **medical record**, and can be adopted by **adopters** through tracked **adoption** events. Your service layer now talks to repositories, not arrays, and your controllers must return the right shape with the right related data eagerly fetched.

> Same constraints as before regarding the framework: keep using NestJS, DTOs, and the global `ValidationPipe` from Homework 2. Persistence now lives in PostgreSQL via TypeORM. You may use `synchronize: true` while developing — migrations are out of scope for this homework.

---

## What's new compared to Homework 2

- Pets are no longer stored in a JS array. They are rows in a PostgreSQL table managed by **TypeORM**.
- The single `Pet` entity is split into a small **graph of related entities** so you can practice every relation type covered in class.
- Endpoints now return data with related entities **eagerly loaded** where it makes sense (a pet without its tags or shelter is not very useful to a client).
- Some operations now span more than one table — adopting a pet, for instance, must update the pet **and** create a new adoption record.
- Filters on `GET /pets` are extended so the manager can list pets by **shelter**, by **tag**, or by **adopter**.

---

## What you are modelling

The shelter network has grown. The data now describes:

- A **pet** still has a name, species, breed, age, and an internal status (`available` or `adopted`).
- Every pet lives in a **shelter** (a physical branch with a name, city, and capacity).
- Every pet has exactly **one medical record** (vaccinated, neutered, last checkup, free-text notes).
- A pet can carry multiple **tags** (short labels like `house-trained`, `kid-friendly`, `senior`). The same tag can describe many pets.
- An **adopter** is a person who can adopt pets. The same person may adopt several pets over time.
- Every time a pet is adopted, the system records an **adoption** event (which adopter, which pet, when it happened, optional notes). Returning a pet to the shelter must close the adoption, not erase it.

You decide table names, column names, and exact cascade settings, but the relation **shapes** below are required.

---

## Required relations

You must implement **all four** relation styles below using TypeORM decorators. Use `relations: { ... }` (or `eager: true` where it really makes sense) so the API responses include the right related data without N+1 queries.

### 1. Pet ↔ Shelter — Many-to-One / One-to-Many

- A shelter has many pets. A pet belongs to **one** shelter.
- A pet must have a shelter assigned when it is created — the create payload should accept a `shelterId`.
- Listing a shelter must be able to return its pets; listing a pet must return the shelter it lives in.
- Deleting a shelter that still has pets must **not** silently orphan them — pick a sensible behaviour (reject the delete, or cascade — defend your choice in the README).

### 2. Pet ↔ MedicalRecord — One-to-One

- Every pet has exactly one medical record. A medical record belongs to exactly one pet.
- The medical record from Homework 2 (vaccinated, neutered, last checkup, notes) becomes its own entity / table.
- The owning side is up to you, but the pet must be the natural entry point: `GET /pets/:id` should return the medical record alongside the pet, and `PATCH /pets/:id/medical` should update it.
- Deleting a pet must also delete its medical record (use `cascade` / `onDelete` — do not leave dangling rows).

### 3. Pet ↔ Tag — Many-to-Many

- A pet can have many tags. A tag can be applied to many pets.
- Tags are first-class: they have their own CRUD endpoints (create, list, delete).
- A tag's `name` is unique (case-insensitive, your call on storage). Trying to create a duplicate tag must return a clear error.
- The pets endpoint must support **adding** and **removing** tags from an existing pet without replacing the whole pet.
- Filtering pets by one or more tag names via query string must work (e.g. `?tags=kid-friendly,house-trained`).

### 4. Adopter — Pet — Adoption — One-to-Many through an explicit join entity

- An **adopter** is a separate entity (full name, email, phone). Email is unique.
- An **adoption** is its own entity with at least: pet, adopter, `adoptedAt` timestamp, optional `returnedAt` timestamp, optional notes.
- An adopter has many adoptions. A pet has many adoptions over its lifetime (one current, possibly several historical).
- This means the link between Pet and Adopter is **Many-to-Many through `Adoption`** — do **not** use `@ManyToMany` with an auto-generated join table here. Model `Adoption` as its own entity with two `@ManyToOne` relations.
- A pet can have at most **one open** adoption at a time (one where `returnedAt` is null). Enforce this rule in the service layer.

---

## Functional requirements

Keep all eight endpoints from Homework 2 and add the ones below. Routing names are suggestions — keep them RESTful.

### Pets (extended from Homework 2)

1. **List pets** — extend the existing filters with:
   - `shelterId` — only pets in that shelter
   - `tags` — comma-separated list of tag names; a pet must have **all** of them to be included
   - `adopterId` — only pets that are currently adopted by that adopter
2. **Get one pet by id** — response must include the shelter, the medical record, and the tags. The current adoption (if any) should also be visible.
3. **Create a pet** — body now requires `shelterId` and may optionally include `tagIds` (existing tags) and an embedded medical record block. Creating a pet without a medical record is **not allowed** — every pet must have one from day one.
4. **Update a pet** (PUT / PATCH) — same as Homework 2, but the medical record fields are no longer part of the pet body. They are managed via a dedicated endpoint (see below).
5. **Delete a pet** — must also delete its medical record and remove its tag links. Open adoptions involving this pet must be closed (`returnedAt` set to now) before deletion, not silently dropped.

### Shelters (new)

6. **CRUD for shelters** — create, list, get one, update, delete. `GET /shelters/:id` includes the pets that currently live there.

### Tags (new)

7. **CRUD for tags** — create, list, get one, delete. Listing tags supports a `q` query param for partial name search.
8. **Attach a tag to a pet** and **detach a tag from a pet** as their own endpoints (do not require the client to resend the entire pet to add/remove a single tag).

### Adopters (new)

9. **CRUD for adopters** — create, list, get one, update, delete.
10. `GET /adopters/:id` includes the adopter's adoptions, and through them the pets they have adopted (current and historical).

### Adoption flow (rewires the Homework 2 endpoints)

11. **Adopt a pet** — endpoint now takes the `adopterId` in the body. It must:
    - confirm the pet is currently `available`,
    - confirm the adopter exists,
    - set the pet to `adopted`,
    - create a new `Adoption` row with `adoptedAt = now`.
    - All of this must happen atomically — partial failures must roll back. Use a TypeORM **transaction**.
12. **Return a pet to the shelter** — must:
    - confirm the pet is currently `adopted`,
    - find the open adoption for that pet,
    - close it by setting `returnedAt = now`,
    - flip the pet status back to `available`.
    - Same atomicity rule as adopt.
13. **List a pet's adoption history** — `GET /pets/:id/adoptions` returns all adoptions for that pet, ordered newest-first, with adopter info on each row.

---

## What to validate (additions to Homework 2)

Keep every rule from Homework 2 and add:

### Pet payload

- `shelterId` is required on create and must be a valid UUID. The shelter must exist or the request is rejected (404, not 400).
- `tagIds`, if provided, is an array of valid UUIDs. Each tag must exist; missing tags result in a clear error that names which one is missing.
- The embedded `medical` block on create stays validated as in Homework 2, but is now **required**.

### Shelter payload

- `name` — required, sensible min/max length, no unreasonable characters.
- `city` — required, sensible min/max length.
- `capacity` — required, integer, at least 1, at most something realistic (you pick — defend in README).

### Tag payload

- `name` — required, short (sensible min/max), unique across the system. Treat names case-insensitively when checking uniqueness.

### Adopter payload

- `fullName` — required, sensible min/max length, letters/spaces/apostrophes/hyphens only.
- `email` — required, valid email, unique across the system.
- `phone` — optional, but if present must look like a phone number (basic check is enough).

### Adopt / return payloads

- The `adopterId` on `POST /pets/:id/adopt` is required and must be a valid UUID.
- All cross-entity ids (shelterId, adopterId, tagIds) must be validated as UUIDs in DTOs, the same way you validated route params in Homework 2.

---

## What relations must look like in responses

This is what students most often get wrong on this homework — the relations exist in the database but the JSON does not show them. Make sure your responses look like a real graph:

- `GET /pets/:id` returns: pet fields **+** `shelter: { id, name, city }` **+** `medical: { ... }` **+** `tags: [{ id, name }]` **+** `currentAdoption: { adopter: { id, fullName }, adoptedAt }` (or `null` if available).
- `GET /pets` returns the same shape per pet (you may decide to drop the medical block from the list response — defend the choice in your README).
- `GET /shelters/:id` returns shelter fields **+** `pets: [{ id, name, status }]`.
- `GET /adopters/:id` returns adopter fields **+** `adoptions: [{ id, adoptedAt, returnedAt, pet: { id, name } }]`.

You can shape these responses with response DTOs / mappers, with TypeORM `relations`, with `select`, or with QueryBuilder — your call. What matters is that the API consumer never has to do a second request to figure out who lives where, who adopted whom, or what tags a pet carries.

---

## What to enforce in the service layer

- The **transactional** rules above for adopt and return must really be transactions — pull a `DataSource` or use the repository's transaction helper. Do **not** simulate a transaction with `try/catch` and manual rollback.
- The "one open adoption per pet" rule is a domain rule. It must be enforced before issuing the second adoption, with a clear 4xx error.
- A delete that would leave dangling related rows must either cascade (where it makes sense, e.g. medical record) or refuse the delete with a clear error (where cascading would be destructive, e.g. shelter with pets).
- Validation, transformation, and conversion still happen in the input layer. The service still trusts its inputs.

---

## What to return when things go wrong (additions to Homework 2)

- Reference to a non-existent related entity (`shelterId`, `tagIds`, `adopterId`) → **404 Not Found**, not 400, with a message that names which entity was missing.
- Trying to adopt a pet that is already adopted, or return one that is already available → **409 Conflict** (or another sensible 4xx — defend the choice in your README), not just a 400.
- Trying to delete a shelter that still has pets → **409 Conflict** with a message that explains why.
- Trying to create a tag/adopter that violates the unique constraint → **409 Conflict**, not a raw database error.
- The framework's built-in exceptions (`NotFoundException`, `ConflictException`, `BadRequestException`) are enough — do not invent your own response shape.

---

## Technical requirements (additions to Homework 2)

- A **PostgreSQL** database, connected via `TypeOrmModule.forRoot(...)` exactly once at the root level (you can keep it inside an `AppModule` or a dedicated `DatabaseModule`).
- Each feature module registers its own entities with `TypeOrmModule.forFeature([...])` and injects repositories via `@InjectRepository(Entity)`.
- All cross-entity ids in the database are **UUIDs**, generated with `@PrimaryGeneratedColumn('uuid')`.
- Each entity has the audit columns from class: `@CreateDateColumn()`, `@UpdateDateColumn()`. Soft-delete (`@DeleteDateColumn`) is **required for `Pet` and `Adopter`** and optional elsewhere — defend the choice in your README.
- `synchronize: true` is fine. Keep credentials in a `.env` file and load them through `@nestjs/config` if you want bonus points (optional).
- Continue to keep controllers thin. The service does the orchestration, the repository does the SQL.
- Strict TypeScript stays on (`"strict": true`).

---

## Getting started

If you are continuing your Homework 2 project, install TypeORM and the Postgres driver and add the database module:

```bash
cd pet-adoption-api
npm install @nestjs/typeorm typeorm pg
npm run start:dev
```

Run a Postgres instance locally — the easiest way is Docker, the same way we did in class:

```bash
docker run \
  --name sedc-pets \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=pets \
  -p 5433:5432 \
  -d postgres:16
```

Then point your `TypeOrmModule.forRoot(...)` at `localhost:5433` (or whichever port you mapped). With `synchronize: true`, the tables will be created automatically on the first run as you add entities.

---

## How to test it (manual checklist for your Postman collection)

For each scenario below, save the request **and** its expected outcome to your Postman collection. Group them in folders so reviewers can find them quickly.

### Setup data

1. Create two shelters in different cities.
2. Create three tags (e.g. `house-trained`, `kid-friendly`, `senior`).
3. Create two adopters with different emails.

### Pets with relations

4. Create a pet in shelter A with two tags and a complete medical record. Confirm the response contains the shelter object, the tags array, and the medical record.
5. Create a second pet in shelter B with no tags. Confirm `tags: []` in the response.
6. Create a pet whose `shelterId` does not exist — must return **404**, not 400.
7. Create a pet with a `tagIds` array containing one valid tag and one invalid one — the whole request must be rejected with a clear message.
8. Create a pet without a medical block — must be rejected.

### Filtering and graph reads

9. List pets in shelter A — only the pets in shelter A come back.
10. List pets with `tags=kid-friendly,house-trained` — only pets that have **both** tags come back, not pets that have just one.
11. `GET /shelters/:id` — confirm it returns the pets that live there.
12. `GET /tags` with `?q=kid` — confirm partial-name search works.

### Tag attach / detach

13. Attach a third tag to an existing pet via the dedicated endpoint. Confirm the tag appears on the pet without re-sending name/breed/etc.
14. Detach a tag from the same pet. Confirm it disappears from the pet response and the tag itself still exists in `GET /tags`.
15. Attach a tag that does not exist — must return **404**.

### Adoption flow

16. Adopt pet 1 with adopter 1. Confirm:
    - the pet status is now `adopted`,
    - `currentAdoption` is populated on the pet,
    - a new adoption row is visible in `GET /pets/:id/adoptions`,
    - `GET /adopters/:id` shows the adoption.
17. Try to adopt pet 1 again with adopter 2 — must be rejected with a clear conflict error.
18. Return pet 1. Confirm:
    - the pet status is back to `available`,
    - the adoption now has `returnedAt` set,
    - `GET /pets/:id/adoptions` still shows the historical adoption.
19. Adopt pet 1 again with adopter 2 — must succeed and create a **new** adoption row, leaving the previous one untouched.
20. Try to return a pet that is already available — must be rejected.

### Cross-entity deletion rules

21. Try to delete a shelter that still has pets — must be rejected.
22. Empty the shelter (move pets or delete them) and delete the shelter — must succeed.
23. Delete a pet that is currently adopted — adoption must be closed and the medical record must be removed. Confirm there are no dangling adoption rows pointing at a non-existent pet.

### Validation

24. All Homework 2 validation cases must still pass on the new shape (negative age, bad name, unknown fields, etc.).
25. Create an adopter with a duplicate email — must be rejected with **409**.
26. Create a tag with a duplicate name (different casing) — must be rejected with **409**.

---

## Submission

Same as Homework 2, plus:

- A short section in your project README documenting:
  - Your cascade choices for each relation (what happens to medical records, tags, and adoptions when their parent is deleted) and **why**.
  - Whether you used `eager: true` on any relation and your reasoning.
  - Which entities you marked soft-deletable beyond pets/adopters and why.
  - The status code you picked for "already adopted" / "already available" conflicts.
- A Postman collection that covers everything in the manual checklist above, with folders for **Setup**, **Pets**, **Tags**, **Adoptions**, **Validation errors**, and **Cross-entity deletion**.
- A short note (one paragraph, in the README) describing how you handled the **transactional** parts of adopt/return — which TypeORM API you used and why.

---

## What we are looking for

- Four relation styles (`@OneToOne`, `@OneToMany` / `@ManyToOne`, `@ManyToMany` if you used it, and a `@ManyToOne`-through-explicit-join-entity) all live and working in your schema.
- Responses contain the related data the description above asks for — no consumer should have to make a second call to find a pet's shelter or tags.
- The adopt/return flow is genuinely transactional. A failure in the middle leaves no half-updated rows behind.
- Cross-entity errors return the right HTTP code and a message that names the missing or conflicting entity.
- Validation, DTOs, and global pipes from Homework 2 still apply — you did not silently turn off `forbidNonWhitelisted` to make life easier.
- Controllers are still thin. All persistence logic — `repository.find`, `save`, `update`, transactions — lives in services.
- The Postman collection demonstrates both the happy graph traversals (shelter → pets, adopter → adoptions → pets, pet → tags) and the negative cases (missing related ids, conflicts, cascade rejections).
