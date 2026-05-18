# Homework 2 — Pet Adoption Center API + DTOs & Validation

Extend your **Homework 1** Pet Adoption API with everything you learned in `06_dtos_pipes`.

The features you already built stay the same. The big difference is that every piece of data coming from a client must now be **strictly checked and converted** before your service ever sees it — and your service should be able to trust its inputs 100%.

> Same constraints as Homework 1: no database, no authentication, no external libraries beyond what NestJS gives you for validation and transformation. Data lives in memory and may reset on restart.

---

## What's new compared to Homework 1

- Inputs are described by **dedicated classes** that act as the contract for create, full update, and partial update.
- A **response shape** that includes the server-assigned id.
- Validation runs **globally**, so every endpoint is protected without sprinkling code in each controller.
- Bad payloads are **rejected with a clear error**, never silently accepted.
- Unknown fields are not allowed to sneak through.
- Route parameters and query strings are also validated, not just request bodies.

---

## Functional requirements (unchanged from Homework 1)

A **pet** has:

- a **name**,
- a **species** (one of: `Dog`, `Cat`, `Rabbit`, `Bird`, `Reptile`, `Other`),
- a **breed**,
- an **age in years**,
- an internal status: `available` or `adopted`.

Endpoints (URLs are suggestions — keep them RESTful):

1. List all pets, with optional filters by species and by status.
2. Get one pet by id.
3. Add a new pet (server assigns the id; new pets start as `available`).
4. Fully replace an existing pet.
5. Partially update an existing pet.
6. Remove a pet.
7. Adopt an available pet.
8. Return an adopted pet to the shelter.

---

## What you need to describe with input shapes

You will define separate input shapes for **creating**, **fully replacing**, and **partially updating** a pet, plus an output shape for what the API returns. You decide the file names and folder layout, but keep them inside the pets feature.

Rules to follow when designing those shapes:

- The client must **not** be able to set the id, the status, or any field the server controls.
- The "partial update" shape should be **derived** from the "create" shape, not hand-copied. Re-typing the same rules in two places is a smell — find the helper Nest provides for this.
- The "response" shape should be a natural extension of the "create" shape plus the server-assigned id.
- If you also build a shape for query-string filters, treat it like any other input: it must be validated and unknown filters must be rejected.

---

## What to validate (the end goal, not the recipe)

Use whatever validation tooling you saw in class to enforce **all** of the following. Pick reasonable error messages where the library lets you.

### Pet fields

- **name**
  - is required and must be text
  - has a sensible minimum and maximum length (think shelter names, not novels)
  - only contains letters, spaces, apostrophes, and hyphens — no digits, no symbols
- **species**
  - is required
  - must be one of the species listed above, nothing else
- **breed**
  - is required and must be text
  - has a sensible minimum and maximum length
- **age**
  - is required
  - is a whole number (no decimals)
  - is at least 0 and at most something realistic for a pet (you pick — defend your number in your README)
- **tags** (optional)
  - if provided, is a list of short text labels
  - has a sensible maximum number of items
  - each tag has a sensible min/max length
  - duplicates are not allowed
- **medical** (optional, an object)
  - knows whether the pet is vaccinated (true/false, required when the object is provided)
  - knows whether the pet is neutered (true/false, required when the object is provided)
  - can carry a last-checkup date that arrives as a string and is treated as a real date by your service
  - can carry free-text notes with a sensible maximum length

### Full update vs partial update

- The **full-update** shape behaves exactly like the create shape: every required field stays required.
- The **partial-update** shape lets the client send any subset of fields, but every field that **is** sent must still respect all the validation rules above.

### Identifiers (route params)

- Any `:id` in a URL must be validated as a proper unique identifier. If it isn't, the endpoint must reject the request before reaching your service.

### Query-string filters

- The `species` filter, if provided, must match the same species list as the field above.
- The `status` filter, if provided, must be one of `available` or `adopted`.
- Optional numeric filters (e.g. min/max age) must arrive as proper numbers even though the URL carries them as strings.

### Unknown fields

- A client must not be able to send fields you did not define. If they try, the request must be rejected, not silently accepted.

### Defaults

- Newly created pets default to `available` even if the client does not send a status. The default should come from your input layer, not from your service.

---

## What to enforce globally

- Validation should be **on by default** for every endpoint in the application — you should not have to opt in per controller.
- After validation, your controller methods should receive **fully typed, fully trusted** input. The service must not need to re-check field types or formats.
- Configure your validation so that:
  - extra/unknown properties are not allowed to reach your controllers,
  - primitive values that arrive as strings (route params, query strings) are converted to the correct type automatically,
  - dates, objects and similar non-primitive shapes are converted into real instances of your classes.

---

## What to return when things go wrong

Use the framework's built-in error handling — do not invent your own response shape unless you want the bonus.

- A request with a malformed id → an error response with status code in the **400 family**.
- A request with a body that fails any of the rules above → a response in the **400 family** with a message that identifies what was wrong.
- A pet that does not exist → a **"not found"** response.
- Adopting a pet that is already adopted, or returning a pet that is already available → an error response in the **400 family** that clearly states the conflict.

You should not return `200 OK` with an error embedded in the body. Pick the right HTTP code and let the framework do the rest.

---

## Technical requirements (additions to Homework 1)

- Continue to keep controllers thin. Validation, transformation, and conversion happen in the input layer; persistence and rules happen in the service.
- The id assigned by the service must be a UUID, not an incrementing number.
- Run with strict TypeScript (`"strict": true` in `tsconfig.json`).

---

## Getting started

If you are continuing your Homework 1 project, just add the new input shapes and turn on global validation:

```bash
cd pet-adoption-api
npm install class-validator class-transformer @nestjs/mapped-types
npm run start:dev
```

If you are starting fresh:

```bash
nest new pet-adoption-api
cd pet-adoption-api
npm install class-validator class-transformer @nestjs/mapped-types
rm -rf .git   # only if a nested .git appeared inside the course repo
npm run start:dev
```

---

## How to test it (manual checklist for your Postman collection)

For each scenario below, save the request **and** its expected outcome to your Postman collection.

### Happy path

1. Create a pet with a complete, valid body. Confirm a UUID-style id is returned.
2. List pets and confirm the new pet is there.
3. Filter the list by species and then by status. Confirm only matching pets come back.
4. Get the pet by id.
5. Partially update only the breed. Confirm everything else stayed the same.
6. Fully replace the pet with a new body. Confirm every field changed but the id is stable.
7. Adopt the pet, then return it. Confirm the status transitions both times.
8. Delete the pet.

### Validation — these must all be rejected

For each one, your API should answer with the right error code; do not accept the request and then quietly clean it up.

9. Empty body on create.
10. Empty / very short / very long name.
11. Name containing digits or symbols.
12. Species that is not in the allowed list.
13. Negative age, an unreasonably large age, a decimal age.
14. Tags list with duplicates, with an empty string, or with more items than allowed.
15. A `medical` block where vaccinated/neutered are not booleans.
16. A `medical.lastCheckup` value that is not a valid date.
17. A request body with an extra unknown field (e.g. `isAdmin: true`).
18. A patch request where every individual field is valid in isolation, but the body itself is empty — decide whether your API should allow this and document your choice in the project README.
19. An id in the URL that is not a valid unique identifier format.

### State errors

20. Adopt a pet that is already adopted.
21. Return a pet that is already available.
22. Any operation on an id that does not exist.

---

## Submission

Same as Homework 1, plus:

- A short section in your project README listing:
  - The min/max numbers you chose for name length, age, tags, etc. and **why**.
  - Whether you allow empty PATCH bodies (and why).
- A Postman collection that includes the **negative-test requests** (items 9–22 above), grouped in a "Validation errors" folder so they are easy to find during review.

---

## What we are looking for

- Inputs for create, full update, partial update, and response are clearly separated — no single mega-shape doing everything.
- Validation rules are written **once** and reused for partial updates, not copy-pasted.
- Every field has the right kind of check; "is text" alone is not enough for a constrained field like species or age.
- Validation is enabled globally — a future endpoint added by another developer is protected automatically.
- Route parameters and query strings are validated and converted, not just request bodies.
- The controller still does nothing more than translate HTTP into service calls.
- The Postman collection clearly demonstrates both successful flows and a generous set of validation failures.
