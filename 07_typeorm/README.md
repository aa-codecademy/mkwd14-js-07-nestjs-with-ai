# NestJS — Databases with TypeORM (SEDC)

This lesson teaches how to connect a NestJS application to a real relational database (PostgreSQL) using **TypeORM**, the most popular ORM in the Nest ecosystem.

You will learn:

- What an **ORM** is and why we use one
- How **TypeORM** connects to a database in Nest (`forRoot` vs `forFeature`)
- How to declare an **Entity** and what every decorator does (`@Entity`, `@Column`, `@PrimaryGeneratedColumn`, …)
- How to use a **`Repository<T>`** — `create`, `save`, `find`, `findOneBy`, `update`, `softDelete`
- The difference between **soft delete** and **hard delete**
- Why **`synchronize: true`** is fine in class and dangerous in production
- The role of **migrations** and where to go next

> Validation/DTOs from the previous lesson are still in this project. They are **not** the subject of this lesson — feel free to read those files separately. This README focuses purely on TypeORM and the database layer.

---

## 1. What is an ORM?

An **Object–Relational Mapper** maps rows in a relational database (`SELECT * FROM artist`) to objects in your code (`Artist { id, name, … }`) and back. Instead of writing SQL by hand you describe a **class** and the ORM:

- creates the table for you (or generates a migration that does)
- turns method calls (`repository.find()`) into SQL (`SELECT * FROM artist`)
- hydrates the result into instances of your class
- tracks changes and writes them back when you call `save()`

```
┌──────────────────────────────┐    ┌──────────────────────────────┐
│  TypeScript world            │    │  PostgreSQL world            │
│                              │    │                              │
│  class Artist {              │◀──▶│  TABLE artist (              │
│    id: string                │    │    id uuid PRIMARY KEY,      │
│    name: string              │    │    name varchar(120),        │
│    genre: string             │    │    genre varchar(30),        │
│    ...                       │    │    ...                       │
│  }                           │    │  )                           │
│                              │    │                              │
│  repository.find()           │───▶│  SELECT * FROM artist        │
│  repository.save(artist)     │───▶│  INSERT / UPDATE             │
└──────────────────────────────┘    └──────────────────────────────┘
```

### Trade-offs

| Pros | Cons |
|------|------|
| Less boilerplate | Hides SQL — easy to write slow queries |
| Type-safe queries | Magic at runtime (decorators, metadata) |
| Schema lives next to the code | Another abstraction to learn |
| Easy CRUD, hooks, soft delete | Complex queries still need raw SQL / QueryBuilder |

> **Rule of thumb:** use the ORM for 90% of CRUD, drop down to **QueryBuilder** or raw SQL when you need joins, window functions, or fine-grained tuning.

**Read more:**
- [Wikipedia — Object–relational mapping](https://en.wikipedia.org/wiki/Object%E2%80%93relational_mapping)
- [Martin Fowler — ORM Hate](https://martinfowler.com/bliki/OrmHate.html) (a balanced critique — worth knowing the criticisms!)

---

## 2. Why TypeORM?

TypeORM is the ORM Nest officially recommends in its docs. Reasons:

- **TypeScript-first** — built around decorators, plays well with `tsconfig.json`'s `experimentalDecorators` and `emitDecoratorMetadata`.
- **Multi-database** — Postgres, MySQL, MariaDB, SQLite, MSSQL, Oracle, MongoDB.
- **Active Record _and_ Data Mapper** patterns supported (we use Data Mapper here = `Repository<T>`).
- **Migrations**, **query builder**, **relations**, **transactions**, **subscribers/hooks** out of the box.
- First-class Nest integration via [`@nestjs/typeorm`](https://docs.nestjs.com/techniques/database).

Alternatives you may meet in real projects:

| ORM | Notes |
|-----|-------|
| **Prisma** | Schema-first, modern, great DX. Migrations are easier than TypeORM's. |
| **MikroORM** | Data Mapper + Unit of Work. Strong TypeScript story. |
| **Sequelize** | Older, JS-first, less TS-friendly. |
| **Drizzle** | Very thin, SQL-shaped, no decorators. |

For this lesson we stick with TypeORM because the rest of the course uses it.

---

## 3. Setting up PostgreSQL

The connection in `src/db/database.module.ts` is hard-coded to:

```
host:     localhost
port:     5433
user:     postgres
password: postgres
database: music
```

The fastest way to get a matching server running is Docker:

```bash
docker run \
  --name sedc-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=music \
  -p 5433:5432 \
  -d postgres:16
```

Verify it's up:

```bash
docker ps                          # should show sedc-postgres listening on 0.0.0.0:5433
psql -h localhost -p 5433 -U postgres -d music   # password: postgres
```

> If you already have Postgres listening on `5432`, just change the `port` in `database.module.ts` — or use a GUI client like **TablePlus**, **Beekeeper Studio**, or **pgAdmin**.

**Read more:**
- [PostgreSQL docs](https://www.postgresql.org/docs/)
- [Postgres Docker image](https://hub.docker.com/_/postgres)

---

## 4. The Nest + TypeORM connection model

Nest exposes TypeORM through one module: [`@nestjs/typeorm`](https://docs.nestjs.com/techniques/database). It has **two** static methods you need to remember:

```
┌─────────────────────────────────────────────────────────────┐
│  AppModule                                                  │
│     └── DatabaseModule                                      │
│           └── TypeOrmModule.forRoot({ type: 'postgres' })   │ ◀ creates the DataSource (the connection)
│                                                             │
│  ArtistModule                                               │
│     └── TypeOrmModule.forFeature([Artist])                  │ ◀ registers Repository<Artist>
│  SongModule                                                 │
│     └── TypeOrmModule.forFeature([Song])                    │ ◀ registers Repository<Song>
│  AlbumModule                                                │
│     └── TypeOrmModule.forFeature([Album])                   │ ◀ registers Repository<Album>
└─────────────────────────────────────────────────────────────┘
```

### `TypeOrmModule.forRoot(...)`

Called **once**, in a module that's imported at the root (`AppModule`).
It builds a single **`DataSource`** — TypeORM's name for an active connection pool — and makes it available everywhere.

See `src/db/database.module.ts`:

```ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'postgres',
  password: 'postgres',
  database: 'music',
  autoLoadEntities: true,
  synchronize: true,
});
```

Notable options:

| Option | What it does |
|--------|--------------|
| `type` | Selects the driver. Needs the matching npm package (`pg` for Postgres). |
| `host` / `port` / `username` / `password` / `database` | Connection coordinates. **Should come from env vars in real apps.** |
| `entities: [Artist, Song]` | Manual list of entity classes. Skip this when using `autoLoadEntities`. |
| `autoLoadEntities: true` | Each `forFeature([X])` call adds `X` to the connection. The recommended Nest pattern. |
| `synchronize: true` | DDL is auto-adjusted to match your entities on every start. **DEV ONLY.** |
| `logging: ['query', 'error']` | Prints SQL to the console — invaluable for learning. |
| `ssl: { rejectUnauthorized: false }` | Needed for managed databases (Neon, Supabase, RDS). |
| `namingStrategy` | Customize how class/property names become `snake_case` columns. |

> **`synchronize: true`** is great while you're learning — change an entity, restart, and the table follows. It is also **dangerous in production** because it can drop columns and lose data. In production you ship **migrations**.

### `TypeOrmModule.forFeature([Entity])`

Called inside each **feature module** that wants to talk to its own entity. It registers a `Repository<Entity>` provider scoped to that module so you can `@InjectRepository(Entity)` it in services.

See `src/album/album.module.ts`:

```ts
@Module({
  imports: [TypeOrmModule.forFeature([Album])],
  controllers: [AlbumController],
  providers: [AlbumService],
})
export class AlbumModule {}
```

**Read more:**
- [Nest — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [TypeORM — DataSource](https://typeorm.io/data-source)

---

## 5. Loading config from env (better than hard-coding)

Hard-coded credentials are fine for the classroom; in real life use `@nestjs/config` so secrets live in `.env`, never in git:

```ts
// app.module.ts (excerpt — NOT in this lesson on purpose)
ConfigModule.forRoot({ isGlobal: true }),
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (cfg: ConfigService) => ({
    type: 'postgres',
    host: cfg.get('DB_HOST'),
    port: cfg.getOrThrow<number>('DB_PORT'),
    username: cfg.get('DB_USER'),
    password: cfg.get('DB_PASSWORD'),
    database: cfg.get('DB_NAME'),
    autoLoadEntities: true,
    synchronize: false,  // ← always false in prod
  }),
}),
```

**Read more:** [Nest — Configuration](https://docs.nestjs.com/techniques/configuration).

---

## 6. Entities — the decorator cheat sheet

An **entity** is a TypeScript class with metadata that TypeORM turns into a table.

```ts
@Entity()
export class Album {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ length: 200 })        title!: string;
  @Column('uuid')                 artistId!: string;
  @Column({ type: 'timestamptz', nullable: true }) releaseDate!: Date | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date | null;
  @DeleteDateColumn() deletedAt!: Date | null;
}
```

### Class & primary key

| Decorator | What it does |
|-----------|--------------|
| `@Entity()` | Marks the class as a table. Default name = lowercase class name. Override: `@Entity('albums')`. |
| `@PrimaryGeneratedColumn()` | Auto-incrementing integer PK. |
| `@PrimaryGeneratedColumn('uuid')` | UUID v4 PK (safer for public APIs). |
| `@PrimaryColumn()` | You assign the PK yourself (composite keys, natural keys). |

### Regular columns — `@Column()` options

| Option | Purpose | Example |
|--------|---------|---------|
| `type` | DB type override | `{ type: 'int' }`, `{ type: 'timestamptz' }`, `{ type: 'jsonb' }` |
| `length` | `varchar` length | `{ length: 200 }` |
| `nullable` | Allow `NULL` | `{ nullable: true }` |
| `default` | DB-level default | `{ default: false }` |
| `unique` | Add a UNIQUE constraint | `{ unique: true }` |
| `name` | Custom column name | `{ name: 'release_date' }` |
| `select: false` | Exclude from default SELECTs (passwords!) | `{ select: false }` |

> Common types you'll meet in Postgres: `text`, `varchar`, `int`, `bigint`, `boolean`, `timestamptz`, `date`, `numeric`, `jsonb`, `uuid`, `enum`.

### Audit & soft-delete columns (free goodies)

| Decorator | Effect |
|-----------|--------|
| `@CreateDateColumn()` | Set automatically on first save. |
| `@UpdateDateColumn()` | Refreshed automatically on every save after creation. |
| `@DeleteDateColumn()` | Enables `repository.softDelete(id)` — sets a timestamp instead of deleting the row. Subsequent `find()`s skip it automatically. |
| `@VersionColumn()` | Optimistic concurrency control — increments on each update. |

### Relations — quick preview

```ts
@ManyToOne(() => Artist, (a) => a.albums) artist!: Artist;
@OneToMany(() => Album, (a) => a.artist)  albums!: Album[];
@OneToOne(() => Profile)                  @JoinColumn() profile!: Profile;
@ManyToMany(() => Tag)                    @JoinTable()  tags!: Tag[];
```

This project uses real relations (`@OneToMany`, `@ManyToOne`, `@OneToOne`). The next section is a deep dive into how they work.

**Read more:**
- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Decorator reference](https://typeorm.io/decorator-reference)
- [TypeORM — Relations](https://typeorm.io/relations)

---

## 7. Relations — modeling associations between tables

Relations are how you tell TypeORM "this entity is connected to that one". They turn into foreign keys in SQL and into navigable object properties in TypeScript.

### 7.1 The four relation types

| Decorator | Cardinality | Example in this project |
|-----------|-------------|-------------------------|
| `@OneToOne` | 1 ↔ 1 | `Artist` ↔ `ArtistProfile` |
| `@OneToMany` / `@ManyToOne` | 1 ↔ N | `Artist` ↔ `Song`, `Artist` ↔ `Album`, `Album` ↔ `Song` |
| `@ManyToMany` | N ↔ N | not used here — see "Further reading" |

### 7.2 The data model used in this project

```
                        ┌──────────────────┐
                        │  ArtistProfile   │
                        │ (1:1 inverse 👇) │
                        └─────────▲────────┘
                                  │ @JoinColumn (FK lives here)
                                  │
   ┌────────────────────────┐    @OneToOne                    ┌────────┐
   │         Artist         │◀──────────────                  │  Song  │
   │ ────────────────────── │                                 │ ────── │
   │  songs   @OneToMany ───┼──────@ManyToOne──── artist ──── │ artist │
   │  albums  @OneToMany ───┼──────@ManyToOne──── artist ──── │ ...    │
   │  profile @OneToOne ◀───┼  (inverse)                      │        │
   └────────────────────────┘                                 │ album  │ ◀── @ManyToOne
                                                              │ ...    │
                          ┌────────┐                          └────┬───┘
                          │ Album  │                               │
                          │ ────── │                               │
                          │ artist │── @ManyToOne ── Artist        │
                          │ songs  │── @OneToMany ────────────────▶│
                          └────────┘
```

### 7.3 Owning side vs inverse side

Every bidirectional relation has two sides:

- **Owning side** — the side that stores the foreign key column in the database.
- **Inverse side** — the side that *navigates* to the related entity but stores no FK.

| Relation | Owning side (has FK + decorator) | Inverse side (no FK) |
|----------|----------------------------------|----------------------|
| `@OneToOne` | side with `@JoinColumn()` | the other side |
| `@OneToMany` ↔ `@ManyToOne` | always the `@ManyToOne` side | always the `@OneToMany` side |
| `@ManyToMany` | side with `@JoinTable()` | the other side |

This is why all our `@OneToMany` decorators in `Artist` look "empty" — they have no DB column. The actual FK lives on `Song.artistId` / `Album.artistId`.

```ts
// artist.entity.ts (INVERSE side — no FK, just a virtual list)
@OneToMany(() => Song, (song) => song.artist)
songs!: Song[];

// song.entity.ts (OWNING side — has the FK column)
@Column('uuid')
artistId!: string;

@ManyToOne(() => Artist, (artist) => artist.songs)
artist!: Artist;
```

### 7.4 `@ManyToOne` / `@OneToMany` — one-to-many in detail

The most common relation. Used three times in this project:

| Parent (1) | Child (N) | Files |
|------------|-----------|-------|
| `Artist` | `Song` | `Song.artist` is `@ManyToOne`, `Artist.songs` is `@OneToMany` |
| `Artist` | `Album` | `Album.artist` is `@ManyToOne`, `Artist.albums` is `@OneToMany` |
| `Album` | `Song` | `Song.album` is `@ManyToOne`, `Album.songs` is `@OneToMany` |

Notice how `Song` has TWO `@ManyToOne` relations — to `Artist` AND to `Album`. A child entity can have any number of parents.

#### Why we keep an explicit FK column

We declare `@Column('uuid') artistId!: string;` next to `@ManyToOne(() => Artist, …)`. We could omit the column — TypeORM would create one automatically — but keeping it explicit has real benefits:

- ✅ You can write `body.artistId = '…'` from a controller without loading the full `Artist` entity.
- ✅ You can filter: `find({ where: { artistId } })` without a JOIN.
- ✅ The schema is obvious from reading the file.

#### Useful `@ManyToOne` options

```ts
@ManyToOne(() => Artist, (a) => a.albums, {
  onDelete: 'CASCADE',     // delete albums when the artist is deleted
  onUpdate: 'CASCADE',     // update FK when the parent PK changes (rare)
  nullable: false,         // FK column is NOT NULL
  eager: true,             // always load the artist when finding albums
  lazy: false,             // see 7.7 for lazy relations
})
artist!: Artist;
```

### 7.5 `@OneToOne` — one-to-one in detail

Used between `Artist` and `ArtistProfile`. Profiles are extra metadata that not every artist will have, so we keep them in their own table.

```ts
// artist-profile.entity.ts (OWNING side — has FK + @JoinColumn)
@Column('uuid')
artistId!: string;

@OneToOne(() => Artist, (artist) => artist.profile)
@JoinColumn()
artist!: Artist;

// artist.entity.ts (INVERSE side)
@OneToOne(() => ArtistProfile, (profile) => profile.artist)
profile!: ArtistProfile;
```

**Rule of thumb:** put `@JoinColumn()` on the OPTIONAL side — the side that "depends on" the other. An artist exists with or without a profile, but a profile cannot exist without an artist, so the FK lives on `ArtistProfile`.

### 7.6 `@ManyToMany` — many-to-many (not in this project)

Use when both sides can have many of the other (e.g. an `Author` writes many `Book`s, and a `Book` can have many `Author`s). TypeORM creates a hidden **junction table** for you.

```ts
// book.entity.ts
@ManyToMany(() => Author, (a) => a.books)
@JoinTable()      // ONE side must declare @JoinTable() — that's the owner
authors!: Author[];

// author.entity.ts (inverse — no @JoinTable)
@ManyToMany(() => Book, (b) => b.authors)
books!: Book[];
```

The next exercise on `Song.featuringArtists` is a perfect candidate for `@ManyToMany`.

### 7.7 Loading related rows — `relations`, `eager`, lazy

By default, related entities are NOT loaded — relation fields come back `undefined`. Three ways to populate them:

#### A. Per-query (recommended)

```ts
this.albumRepository.findOne({
  where: { id },
  relations: { artist: true, songs: true },
});
```

You see this everywhere in our services (`AlbumService.findOne`, `ArtistService.getAllArtists`, etc.). Each `relations` flag adds a LEFT JOIN — request only what the endpoint needs.

You can nest:

```ts
relations: { artist: { profile: true } }   // album → artist → profile
```

#### B. Always load (`eager: true`)

Set on the relation decorator. Loaded on EVERY find, no opt-out. Use sparingly — eager relations can balloon your queries.

```ts
@ManyToOne(() => Artist, (a) => a.albums, { eager: true })
artist!: Artist;
```

#### C. Lazy relations (advanced)

Type the field as `Promise<T>` and TypeORM defers the load until you `await` the property. Powerful but can hide N+1 query problems — use only if you understand the trade-off.

```ts
@ManyToOne(() => Artist, (a) => a.albums, { lazy: true })
artist!: Promise<Artist>;
// usage:
const artist = await album.artist;
```

> **Performance tip:** loading multiple relations with `relations` works for small graphs, but for complex reads (joins, aggregates, custom selects) reach for the QueryBuilder (see section 12).

### 7.8 Saving related entities

#### Pattern 1 — set the FK column directly (simplest)

What our code does today:

```ts
const album = this.albumRepository.create({
  title: dto.title,
  artistId: dto.artistId,   // just an FK string
});
await this.albumRepository.save(album);
```

#### Pattern 2 — assign the related instance

```ts
const artist = await this.artistRepository.findOneBy({ id: dto.artistId });
const album  = this.albumRepository.create({ title: dto.title, artist });
await this.albumRepository.save(album);
```

#### Pattern 3 — cascade insert

Lets `save()` insert the parent AND the related rows in one call:

```ts
@OneToMany(() => Song, (s) => s.album, { cascade: ['insert', 'update'] })
songs!: Song[];
```

```ts
await this.albumRepository.save({
  title: 'Discovery',
  artistId: '…',
  songs: [{ title: 'One More Time', durationSeconds: 320 }],   // inserted automatically
});
```

> Use cascade carefully — convenient, but easy to delete more than you intended. Most teams prefer explicit child writes.

### 7.9 Delete behavior — `onDelete`

The `onDelete` option on `@ManyToOne` (and `@OneToOne`) maps directly to a Postgres `ON DELETE` rule on the FK constraint:

| Value | What happens when the parent is deleted |
|-------|-----------------------------------------|
| `NO ACTION` (default) | DB error — the parent can't be deleted while children exist. |
| `CASCADE` | Children are deleted too. |
| `SET NULL` | Children's FK column becomes `NULL` (column must be nullable). |
| `RESTRICT` | Same as `NO ACTION` for most drivers — refuses the delete. |
| `DEFAULT` | Children's FK is set to its column default. |

> Soft delete + cascade interaction: cascading does not currently chain through `softDelete()` in TypeORM — you delete children explicitly or fall back to a service-level loop / a custom subscriber.

### 7.10 Cross-entity FK validation in services

When a controller passes you an FK (`artistId`, `albumId`), validate it before inserting:

```ts
// album.service.ts
const artist = await this.artistRepository.findOneBy({ id: body.artistId });
if (!artist) {
  throw new NotFoundException(`Artist with ID: ${body.artistId} doesn't exist.`);
}
```

Why bother when Postgres will reject the bad FK anyway?

- 🟢 The user gets a clean **404 Not Found** instead of a generic 500.
- 🟢 The error happens BEFORE the row is created — no half-written state.
- 🟢 You avoid leaking SQL error text to clients.

Pattern in this project:
- `AlbumService` injects `Repository<Artist>` to validate `artistId`.
- `SongService` injects both `Repository<Artist>` and `Repository<Album>` to validate both FKs.

You'll also see this in `AlbumModule.imports` and `SongModule.imports` — the entity is registered in `forFeature` of every module that needs to read it. That's allowed; the connection is shared.

### 7.11 Common pitfalls

- **Forgot `@JoinColumn()` on a `@OneToOne`?** TypeORM doesn't know which side owns the FK and you'll get cryptic errors at startup.
- **Both sides have `@JoinTable()` on a `@ManyToMany`?** Only ONE side may. Pick one.
- **Circular imports between entity files?** Use the lazy import form: `() => Artist` instead of importing the type. The arrow function is what makes it work.
- **Relation field is `undefined` after `find()`.** You forgot to add `relations: { foo: true }`. Plain `find()` does NOT load relations by default.
- **N+1 queries when iterating.** If you `forEach` over a list and lazy-load `await x.artist` inside the loop, you're doing N database round-trips. Eager-load with `relations` instead.
- **`onDelete: 'CASCADE'` ≠ `softDelete()` cascade.** Cascading FK deletes only fire on hard `DELETE`s.

**Read more:**
- [TypeORM — Relations overview](https://typeorm.io/relations)
- [TypeORM — One-to-one relations](https://typeorm.io/one-to-one-relations)
- [TypeORM — Many-to-one / one-to-many](https://typeorm.io/many-to-one-one-to-many-relations)
- [TypeORM — Many-to-many relations](https://typeorm.io/many-to-many-relations)
- [TypeORM — Eager and lazy relations](https://typeorm.io/eager-and-lazy-relations)
- [TypeORM — Relations FAQ](https://typeorm.io/relations-faq)
- [PostgreSQL — Foreign keys](https://www.postgresql.org/docs/current/tutorial-fk.html)

---

## 8. The Repository pattern — `Repository<T>`

Once an entity is registered with `forFeature(...)`, Nest can inject a typed repository into your service:

```ts
@Injectable()
export class AlbumService {
  constructor(
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
  ) {}
}
```

`Repository<T>` is a fluent API for the 90% of day-to-day operations. Below is a *map* of the methods used in this project plus the ones you'll need most often in real life.

### Reading

```ts
albumRepository.find();                           // all rows
albumRepository.find({ take: 10, skip: 20 });     // paginate
albumRepository.find({ where: { isExplicit: true }, order: { createdAt: 'DESC' } });
albumRepository.findOneBy({ id });                // returns row | null
albumRepository.findOne({ where: { id }, relations: { artist: true } });
albumRepository.findOneOrFail({ where: { id } }); // throws EntityNotFoundError
albumRepository.count({ where: { isExplicit: true } });
albumRepository.findAndCount();                   // [rows, total]
```

### Writing

```ts
const entity  = repo.create(dto);                 // build instance, no DB yet
const saved   = await repo.save(entity);          // INSERT (or UPDATE if PK set)
await repo.insert(dto);                            // INSERT only, no SELECT back
await repo.update(id, partial);                    // raw UPDATE (no hooks)
await repo.upsert([dto], ['email']);               // INSERT … ON CONFLICT
```

### Deleting

```ts
await repo.softDelete(id);   // sets deletedAt, keeps row
await repo.restore(id);      // un-soft-delete
await repo.delete(id);       // hard DELETE (irreversible)
```

### `create()` vs `save()` — the one thing students always mix up

- **`repository.create(plain)`** → returns a NEW instance of your entity class with the given fields. **Does not** touch the database.
- **`repository.save(entity)`** → reads the entity's primary key:
  - missing PK → SQL `INSERT`
  - existing PK → SQL `UPDATE`

The typical "create" handler is therefore:

```ts
const entity = this.repo.create(dto);     // hydrate + apply class defaults
const saved  = await this.repo.save(entity); // INSERT
return saved;
```

You **can** call `save(dto)` directly without `create`, but going through `create()` is the recommended pattern because it ensures the object is a true instance (lifecycle hooks fire, defaults apply, etc.).

### Two ways to update (compare `AlbumService.update` vs `SongService.updateSong`)

| Pattern | When to use |
|---------|-------------|
| Load entity → spread DTO → `save({...})` | You want to return the full new row, run hooks, and don't mind one extra SELECT. |
| Guard exists → `repo.update(id, partial)` → reload | You want one fast UPDATE, no hooks. |

Both are in this project on purpose so you can see the trade-off.

**Read more:**
- [TypeORM — Working with Repository](https://typeorm.io/working-with-repository)
- [TypeORM — Find options](https://typeorm.io/find-options)

---

## 9. Soft delete vs hard delete

Hard delete (`repo.delete(id)`):

```sql
DELETE FROM album WHERE id = $1;
```

Soft delete (`repo.softDelete(id)`, requires `@DeleteDateColumn`):

```sql
UPDATE album SET "deletedAt" = NOW() WHERE id = $1;
-- Subsequent SELECTs add: AND "deletedAt" IS NULL
```

Why prefer soft delete?

- **Undo** is one method call (`repo.restore(id)`).
- **Audit trails** — you still know who/what existed.
- **GDPR right-to-be-forgotten** with a grace period.
- Foreign keys to "deleted" rows don't break.

When to use hard delete: when you really must remove the data (compliance, PII purge, cost). Note: soft-deleted rows are still indexed, still counted in raw `COUNT(*)`, and still consume disk — you usually pair soft delete with a scheduled cleanup job.

### Working with soft-deleted rows

```ts
repo.find({ withDeleted: true });   // include soft-deleted
repo.find();                         // default: hides soft-deleted
repo.restore(id);                    // unset deletedAt
```

---

## 10. The `@InjectRepository(Entity)` decorator

```ts
constructor(
  @InjectRepository(Album)
  private readonly albumRepository: Repository<Album>,
) {}
```

`@InjectRepository(X)` is just a thin wrapper around Nest's normal `@Inject('token')` — `@nestjs/typeorm` generates a unique provider token per entity. You don't need to know the token; the decorator handles it.

You can only inject a repository for an entity that's been registered with `TypeOrmModule.forFeature([X])` **in the same module** (or one that re-exports `TypeOrmModule.forFeature([X])`).

---

## 11. Synchronize vs migrations

| | `synchronize: true` | Migrations |
|---|---|---|
| When | Local dev, learning | Every other environment |
| What it does | Auto-alters the schema to match your entities on app start | You explicitly write/generate SQL change files |
| Risk | Can drop columns / data | Reviewable, reversible, versioned |
| Speed | Instant feedback | Requires a generate + run step |

Typical migration workflow (not done in this project, but **good to know**):

```bash
# 1. Tell TypeORM CLI where your DataSource lives (data-source.ts)
# 2. Generate a migration from the diff between entities and DB
typeorm migration:generate -d data-source.ts src/migrations/AddAlbumIndex

# 3. Run pending migrations on the target DB
typeorm migration:run -d data-source.ts

# 4. Revert the last one if needed
typeorm migration:revert -d data-source.ts
```

**Read more:**
- [TypeORM — Migrations](https://typeorm.io/migrations)
- [Nest — Migrations recipe](https://docs.nestjs.com/recipes/sql-typeorm) (note: docs are slightly behind, principles are the same)

---

## 12. QueryBuilder — when CRUD isn't enough

For anything beyond simple CRUD (joins, aggregation, conditional SQL fragments) you drop into the **QueryBuilder**:

```ts
const result = await this.albumRepository
  .createQueryBuilder('album')
  .leftJoin('artist', 'artist', 'artist.id = album.artistId')
  .where('album.isExplicit = :explicit', { explicit: true })
  .andWhere('artist.genre IN (:...genres)', { genres: ['rock', 'jazz'] })
  .orderBy('album.releaseDate', 'DESC')
  .take(20)
  .getMany();
```

**Read more:** [TypeORM — Query Builder](https://typeorm.io/select-query-builder).

---

## 13. Transactions

When two writes must succeed or fail together, wrap them in a transaction:

```ts
import { DataSource } from 'typeorm';

constructor(private readonly dataSource: DataSource) {}

async transferOwnership(id: string, newArtistId: string) {
  await this.dataSource.transaction(async (manager) => {
    await manager.update(Album, id, { artistId: newArtistId });
    await manager.insert(AuditLog, { albumId: id, action: 'transfer' });
  });
}
```

If the callback throws, both statements are rolled back.

**Read more:** [TypeORM — Transactions](https://typeorm.io/transactions).

---

## 14. Folder map for this lesson

| File | What to study |
|------|---------------|
| `src/db/database.module.ts` | `TypeOrmModule.forRoot` — connection options |
| `src/app.module.ts` | How `DatabaseModule` plugs into the root |
| `src/album/album.entity.ts` | `@Entity`, `@Column`, audit columns, `jsonb`, `@ManyToOne` to Artist, `@OneToMany` to Songs |
| `src/album/album.module.ts` | `TypeOrmModule.forFeature([Album, Artist])` — registering a read-only repo for FK validation |
| `src/album/album.service.ts` | `create` + `save`, `findOne` with relations, "spread merge" update, `softDelete`, FK validation |
| `src/song/song.entity.ts` | Two `@ManyToOne` relations side by side (required + optional) |
| `src/song/song.module.ts` | Three repos in one `forFeature(...)` |
| `src/song/song.service.ts` | `findOne({ where, relations })` and `update + reload` pattern |
| `src/artist/entitites/artist.entity.ts` | Postgres `enum` column, `simple-array`, `@OneToMany` × 2, inverse `@OneToOne` |
| `src/artist/entitites/artist-profile.entity.ts` | Owning `@OneToOne` with `@JoinColumn` |
| `src/artist/artist.module.ts` | Exporting a service for cross-module use, two entities under one module |
| `src/artist/artist.service.ts` | Two-table create flow, eager-loading the profile relation |

---

## 15. Try it yourself

```bash
# 1. Make sure Postgres is running on localhost:5433 (see section 3)
docker start sedc-postgres || docker run --name sedc-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=music -p 5433:5432 -d postgres:16

# 2. Install deps
npm install

# 3. Run with auto-reload — synchronize will create the tables on first start
npm run start:dev
```

Then exercise the API:

```bash
# Create an artist
curl -X POST http://localhost:3000/artist \
  -H "Content-Type: application/json" \
  -d '{ "name": "Daft Punk", "genre": "electronic", "isActive": false, "profile": { "country": "FR" }, "debutYear": 1993 }'

# List them
curl http://localhost:3000/artist

# Create an album linked to that artist's id
curl -X POST http://localhost:3000/album \
  -H "Content-Type: application/json" \
  -d '{ "title": "Discovery", "artistId": "<paste id here>", "releaseDate": "2001-03-12T00:00:00Z" }'

# Soft delete it
curl -X DELETE http://localhost:3000/album/<paste id>

# Verify the row is hidden from /album but still in the DB:
# (in psql:  SELECT id, title, "deletedAt" FROM album;)
```

A Postman collection is also included: `SEDC_2026_Nest.postman_collection.json`.

---

## 16. Exercises

1. **Add an index.** Put `@Index()` on `Artist.genre` and watch what `synchronize: true` does to the schema.
2. **Make `Song.durationSeconds` strictly positive** with a `@Check("durationSeconds > 0")` constraint.
3. **Add `onDelete: 'CASCADE'`** to `Song.album` so deleting an album cleans up its songs. Verify the SQL change with `psql \d song`.
4. **Wrap `ArtistService.createArtist` in a transaction** using `dataSource.transaction(...)` so the artist + profile commit or roll back together.
5. **Add a `@ManyToMany` between `Song` and `Artist`** for "featuring" artists. Add `@JoinTable()` on the `Song` side and update the Song create flow to accept an array of artist IDs.
6. **Eager-load `Artist.profile`** with `{ eager: true }` and remove the explicit `relations: { profile: true }` from `getAllArtists`. Compare the SQL with the logger.
7. **Switch `synchronize` to `false`** and create a migration that adds an `albumCount` column to `Artist`.
8. **Write a paginated `findAll`** on `AlbumService` that accepts `page` and `pageSize` query params, returns `{ items, total, page, pageSize }`, and uses `findAndCount`.
9. **Move DB credentials into `.env`** using `@nestjs/config` and `TypeOrmModule.forRootAsync`.

---

## 17. Further reading

### Official
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [NestJS — Configuration (`@nestjs/config`)](https://docs.nestjs.com/techniques/configuration)
- [TypeORM — Documentation](https://typeorm.io/)
- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Decorator reference](https://typeorm.io/decorator-reference)
- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — Find options](https://typeorm.io/find-options)
- [TypeORM — Relations](https://typeorm.io/relations)
- [TypeORM — QueryBuilder](https://typeorm.io/select-query-builder)
- [TypeORM — Migrations](https://typeorm.io/migrations)
- [TypeORM — Transactions](https://typeorm.io/transactions)
- [PostgreSQL documentation](https://www.postgresql.org/docs/)

### Tutorials & background
- [NestJS + TypeORM CRUD tutorial (NestJS Docs Recipe)](https://docs.nestjs.com/recipes/sql-typeorm)
- [PostgreSQL data types you'll actually use](https://www.postgresql.org/docs/current/datatype.html)
- [Martin Fowler — Patterns of Enterprise Application Architecture (Repository, Data Mapper)](https://martinfowler.com/eaaCatalog/)
- [Wikipedia — Repository pattern](https://en.wikipedia.org/wiki/Domain-driven_design#Building_blocks)

### Tools
- [TablePlus](https://tableplus.com/) — friendly PostgreSQL GUI
- [Beekeeper Studio](https://www.beekeeperstudio.io/) — free open-source DB client
- [pgAdmin](https://www.pgadmin.org/) — the classic PG admin UI

---

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
