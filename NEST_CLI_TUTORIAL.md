# Nest CLI Tutorial (Practical Guide)

This is a hands-on guide for the **NestJS CLI**, with main focus on `**generate`** commands.

---

## 1) Install and verify CLI

```bash
# global install (optional)
npm i -g @nestjs/cli

# verify
nest -v
nest --help
```

---

## 2) Create a new project (most useful flags)

```bash
nest new my-api
```

Useful flags for first-time setup:

- `--skip-git` (`-g`) → do not initialize a `.git` repo
- `--skip-install` (`-s`) → do not run `npm install`
- `--package-manager` (`-p`) → choose `npm`, `yarn`, or `pnpm`
- `--language` (`-l`) → `TS` or `JS`
- `--strict` → strict TypeScript config
- `--collection` (`-c`) → custom schematics collection
- `--dry-run` (`-d`) → preview files without creating them

Examples:

```bash
nest new pet-adoption-api --skip-git --package-manager npm
nest new demo-api --skip-install --strict
nest new prototype --dry-run
```

---

## 3) `nest generate` (main topic)

Syntax:

```bash
nest generate <schematic> <name> [options]
# short form
nest g <schematic> <name> [options]
```

### 3.1 Most used schematics

- `module` (`mo`)
- `controller` (`co`)
- `service` (`s`)
- `resource` (`res`) - full CRUD scaffold
- `provider`
- `guard`
- `interceptor`
- `pipe`
- `filter`
- `gateway`
- `middleware`
- `decorator`
- `class`
- `interface`
- `enum`
- `resolver` (GraphQL projects)

Examples:

```bash
nest g mo pets
nest g co pets
nest g s pets
nest g guard auth/roles
nest g interceptor common/logging
nest g pipe common/parse-id
nest g filter common/http-exception
```

---

## 4) Flags you will use often with `generate`

> Exact flag support can vary by schematic. Check with: `nest g <schematic> --help`

- `--no-spec` → **do not generate test/spec files** (important in many classroom demos)
- `--spec` → force spec file generation
- `--flat` → generate file in current folder (no extra folder)
- `--project <name>` → target a specific project (monorepo/workspace mode)
- `--path <path>` → output in a specific path (where supported)
- `--dry-run` (`-d`) → preview generation without writing files
- `--collection <pkg>` (`-c`) → use another schematics package

Examples:

```bash
# Ignore spec files
nest g co pets --no-spec
nest g s pets --no-spec

# Flat generation (no nested folder)
nest g co pets --flat

# Try generation without writing files
nest g mo billing --dry-run
```

---

## 5) `generate resource` (very useful)

`resource` scaffolds module + controller + service (+ DTOs), and asks interactive questions.

```bash
nest g resource pets
```

Common classroom variant:

```bash
nest g resource orders --no-spec
```

Tip: if you only need custom endpoints and no full scaffold, use separate `module/controller/service` generation.

---

## 6) Fast workflow examples

### A) Clean feature setup (with specs)

```bash
nest g mo users
nest g co users
nest g s users
```

### B) Classroom setup (without specs)

```bash
nest g mo users --no-spec
nest g co users --no-spec
nest g s users --no-spec
```

### C) Nested feature structure

```bash
nest g mo admin/reports
nest g co admin/reports --no-spec
nest g s admin/reports --no-spec
```

---

## 7) Other useful CLI commands

- `nest build` - build project to `dist/`
- `nest start` - start app
- `nest start --watch` - dev/watch mode
- `nest info` - environment and package versions
- `nest add <package>` - install/integrate official Nest integrations

---

## 8) Quick command cheatsheet

```bash
# New project without nested git repo
nest new my-api --skip-git

# Generate controller/service/module without spec files
nest g mo products --no-spec
nest g co products --no-spec
nest g s products --no-spec

# Generate full resource quickly
nest g resource products --no-spec

# See all options for one generator
nest g resource --help
```

---

## 9) Best practice for this course

- Use `--skip-git` when creating projects inside an existing course repository.
- Use `--no-spec` when you want less generated noise for beginner exercises.
- Use `--dry-run` before large generation commands.
- Keep generated structure simple (`module + controller + service`) unless you really need full `resource` scaffold.

