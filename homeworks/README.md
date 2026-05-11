# Homework — Pet Adoption Center API (NestJS basics)

Build a small **REST API** for a neighborhood pet adoption center. The app should use **only** the concepts covered in `02_nest_intro`, `03_controllers_routes`, and `04_providers_di`: modules, controllers, routes, request body / params / query, status codes, services, and dependency injection.

> No database, no authentication, no external libraries beyond what NestJS gives you out of the box. Keep all data **in memory** (it can reset when the server restarts — that is fine).

---

## What you are building

The shelter manager needs an API to keep track of the pets that are currently at the center. Each pet can be **available for adoption** or **already adopted**. When an adoption falls through, a pet may be **returned** to the shelter and put back on the available list.

You decide the URLs, the JSON shapes, and the file/folder names. Focus on **correct behavior** and **clean separation** between controllers and services.

---

## Functional requirements

A **pet** has the following information:

- a **name** (text),
- a **species** (text, for example “Dog”, “Cat”, “Rabbit”),
- a **breed** (text),
- an **age in years** (number),
- whether it is currently **available** or **adopted**.

The API must support the following actions:

1. **List all pets.**
  The shelter manager can also filter the list by **species** using a query parameter (for example, only show “Cat”).
2. **Get a single pet by id.**
  If the id does not exist, return a clear **“not found”** response.
3. **Add a new pet.**
  The client sends name, species, breed, and age. The server assigns the **id** and marks the pet as **available** by default.
4. **Update a pet completely (PUT).**
  Replace name, species, breed, and age for an existing pet. The id stays the same.
5. **Update a pet partially (PATCH).**
  The manager can change only some fields (for example, fix a typo in the breed) without sending the rest.
6. **Remove a pet from the system.**
  Delete a pet by its id. Respond with **204 No Content**.
7. **Adopt a pet.**
  A dedicated endpoint marks an available pet as **adopted**. If the pet is already adopted, respond with a clear error.
8. **Return a pet to the shelter.**
  A dedicated endpoint marks an adopted pet as **available** again. If the pet is already available, respond with a clear error.

---

## Technical requirements

These keep the homework focused on what we covered in class:

- One **Nest module** (`AppModule`) that wires everything together.
- One **controller** dedicated to pets (`PetsController` or similar).
- One **service** (`PetsService` or similar) marked with `@Injectable()` that holds the in-memory list and all the rules above. The controller must **only** map HTTP to service calls — no array manipulation inside the controller.
- The service must be **injected** into the controller through the constructor (this is the dependency-injection pattern from module `04`).
- Use the proper **HTTP method** for each action (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
- Use NestJS built-in exceptions (for example `NotFoundException`) to return correct HTTP error codes — do not return a `200 OK` with an error message in the body.

---

## Getting started

1. Generate a new Nest project (you can use the Nest CLI from `02_nest_intro`):
  ```bash
   nest new pet-adoption-api
   cd pet-adoption-api
   npm run start:dev
  ```
2. If a nested `.git` folder appears inside `pet-adoption-api` and you are working inside the course repo, **delete it** so you do not nest one Git repository inside another:
  ```bash
   rm -rf .git
  ```
3. Add a pets module/controller/service and implement the requirements above.

---

## How to test it

Use **Postman** to try every endpoint. Suggested manual checklist:

- Add 3–4 pets of different species.
- List all pets, then list only one species with the query filter.
- Fetch one pet by id; also try a non-existing id and confirm you get a **404**.
- Update a pet completely and confirm the response shows the new values.
- Update a pet partially and confirm only the changed field is different.
- Adopt a pet, then try to adopt it again — the second attempt must fail.
- Return the same pet, then try to return it again — the second attempt must fail.
- Delete a pet and confirm it disappears from the list.

---

## Submission

Hand in your homework as your trainer instructs (repository, branch, or zip). Your submission should include:

- The Nest project source (without `node_modules`).
- **Postman collection** with the requests you used to test.

---

## What we are looking for

- All the actions above work.
- Controller is **thin**; the service does the work.
- Correct **HTTP status codes** (200, 201, 204, 404, and a sensible code for the adopt/return errors).
- Clean, readable code

