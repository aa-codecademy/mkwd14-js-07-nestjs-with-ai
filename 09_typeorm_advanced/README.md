# NestJS — Databases with TypeORM (SEDC)

This lesson teaches how to connect a NestJS application to a real relational database (PostgreSQL) using **TypeORM**, the most popular ORM in the Nest ecosystem.

You will learn:

- What an **ORM** is and why we use one
- How **TypeORM** connects to a database in Nest (`forRoot` vs `forFeature`)
- How to declare an **Entity** and what every decorator does (`@Entity`, `@Column`, `@PrimaryGeneratedColumn`, …)
- How to model **relations** between tables: `@OneToOne`, `@OneToMany`/`@ManyToOne`, and `@ManyToMany` (with junction tables)
- How to use a **`Repository<T>`** — `create`, `save`, `find`, `findOneBy`, `update`, `softDelete`
- How to add **search, filtering, sorting, and pagination** with `find()` options and find operators (`ILike`, `In`, `Between`, …)
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
| `@ManyToMany` | N ↔ N | `Playlist` ↔ `Song` (via `playlist_songs`) |

### 7.2 The data model used in this project

```
                        ┌──────────────────┐
                        │  ArtistProfile   │
                        └─────────▲────────┘
                                  │ @JoinColumn (FK on profile)
                                  │ @OneToOne
   ┌────────────────────────┐     │                           ┌──────────┐
   │         Artist         │◀────┘                           │   Song   │
   │ ────────────────────── │                                 │ ──────── │
   │  songs   @OneToMany ───┼──────@ManyToOne──── artist ──── │ artist   │
   │  albums  @OneToMany ───┼──────@ManyToOne──── artist ──── │ album    │ ◀── @ManyToOne
   │  profile @OneToOne     │                                 │ playlists│ ◀── @ManyToMany (inverse)
   └────────────────────────┘                                 └────┬─────┘
                                                                   │
                          ┌────────┐                               │
                          │ Album  │                               │
                          │ ────── │                               │
                          │ artist │── @ManyToOne ── Artist        │
                          │ songs  │── @OneToMany ────────────────▶│
                          └────────┘                               │
                                                                   │
                          ┌──────────────────┐                     │
                          │     Playlist     │                     │
                          │ ──────────────── │   @ManyToMany       │
                          │ songs  @JoinTable┼─────────────────────┘
                          └──────────────────┘  ↑ owning side
                                                   junction: playlist_songs
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

### 7.6 `@ManyToMany` — many-to-many in detail

Used in this project between `Playlist` and `Song`: a playlist contains many songs, AND a song can appear in many playlists. Postgres can't express that with a single FK column, so TypeORM creates a **junction table** with two FK columns and a composite primary key.

```ts
// playlist.entity.ts (OWNING side — has @JoinTable)
@ManyToMany(() => Song, (song) => song.playlists)
@JoinTable({ name: 'playlist_songs' })
songs!: Song[];

// song.entity.ts (INVERSE side — no @JoinTable)
@ManyToMany(() => Playlist, (playlist) => playlist.songs)
playlists!: Playlist[];
```

This generates roughly:

```sql
CREATE TABLE playlist_songs (
  "playlistId" uuid REFERENCES playlist(id),
  "songId"     uuid REFERENCES song(id),
  PRIMARY KEY ("playlistId", "songId")
);
```

#### Owning vs inverse

- The **owning** side has the `@JoinTable()` decorator. ONLY ONE side may. That side controls what ends up in the junction table.
- The **inverse** side just references back. Use it for navigation in code (e.g. `song.playlists`).

#### `@JoinTable` options worth knowing

```ts
@JoinTable({
  name: 'playlist_songs',                                       // junction table name
  joinColumn:        { name: 'playlist_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'song_id',     referencedColumnName: 'id' },
})
```

The default column names are `<table>Id` (camelCase). The explicit form is useful when you want snake_case columns to match the rest of your schema (use it alongside a custom `namingStrategy`).

#### Writing to a many-to-many — "set replace" semantics

Saving an array of related entities REPLACES the entire set:

```ts
// playlist.service.ts — addSongs(id, songIds)
const playlist = await this.findOne(id);
const songs    = await this.songRepository.find({ where: { id: In(songIds) } });

await this.playlistRepository.save({ ...playlist, songs }); // diffs the set
```

TypeORM compares the new array to the rows currently in `playlist_songs`, then issues the minimum DELETEs and INSERTs to reconcile them. This is exactly what makes the method suitable for a `PUT` endpoint — see `playlist.controller.ts`.

#### Fine-grained add/remove (no full reload)

If you don't want to load and re-save the whole playlist, use the **relation query builder**:

```ts
await this.playlistRepository
  .createQueryBuilder()
  .relation(Playlist, 'songs')
  .of(playlistId)
  .add(songId);            // just INSERT into playlist_songs

await this.playlistRepository
  .createQueryBuilder()
  .relation(Playlist, 'songs')
  .of(playlistId)
  .addAndRemove([newIds], [oldIds]);  // delta update
```

#### Many-to-many with extra columns (e.g. `position`)

If you need additional fields on the link (an ordered playlist, a "joined at" timestamp, a role), don't use `@ManyToMany` — instead model the junction explicitly as its own entity:

```ts
@Entity()
class PlaylistSong {
  @PrimaryColumn() playlistId!: string;
  @PrimaryColumn() songId!: string;
  @Column('int')   position!: number;

  @ManyToOne(() => Playlist, (p) => p.entries) playlist!: Playlist;
  @ManyToOne(() => Song,     (s) => s.entries) song!: Song;
}
```

This is called the **"junction-as-entity"** pattern. It's the right call any time the relationship itself carries information.

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

## 8. Filtering, sorting, and pagination

Every list endpoint eventually grows the same set of query parameters: search, filter, sort, page. TypeORM gives you all the building blocks via the `find()` options object. This section walks through the recipe used by `GET /artist` (see `ArtistService.getArtists`).

### 8.1 The four ingredients

```ts
this.artistRepository.find({
  where:    { /* filters         */ },
  relations:{ /* eager-load rows */ },
  order:    { /* sort            */ },
  skip:     /* OFFSET            */,
  take:     /* LIMIT             */,
});
```

Translated to SQL:

```sql
SELECT … FROM artist
  LEFT JOIN artist_profile ON …       -- relations
  WHERE  name ILIKE $1 AND genre = $2 -- where
  ORDER BY "createdAt" DESC           -- order
  LIMIT 10 OFFSET 20;                 -- take + skip
```

### 8.2 Dynamic `where` — assemble it conditionally

The cleanest way to build a `where` object from optional query params is "spread as you go":

```ts
let where: FindOptionsWhere<Artist> = {};

if (q)     where = { ...where, name:  ILike(`%${q}%`) };
if (genre) where = { ...where, genre };
```

Omitted parameters produce **no predicate at all** — they don't end up as `WHERE name = NULL`, they simply aren't in the object.

> For complex AND/OR combinations, switch to the **QueryBuilder** (section 12) or pass an ARRAY of `where` objects — TypeORM treats `where: [a, b]` as `(a) OR (b)`.

### 8.3 Find operators

`ILike`, `In`, `Between`, etc. are TypeORM's **find operators** — small wrappers that translate to SQL operators while staying type-safe:

| Operator | SQL | Used in this project? |
|----------|-----|-----------------------|
| `ILike('%foo%')` | `column ILIKE 'X'` (case-insensitive `LIKE`) | ✅ `ArtistService.getArtists` |
| `Like('%foo%')` | `column LIKE 'X'` (case-sensitive) | — |
| `In([a, b, c])` | `column IN (a, b, c)` | ✅ `PlaylistService.addSongs` |
| `Between(a, b)` | `column BETWEEN a AND b` | — |
| `MoreThan(n)` / `LessThan(n)` | `> n` / `< n` | — |
| `MoreThanOrEqual(n)` / `LessThanOrEqual(n)` | `>=` / `<=` | — |
| `IsNull()` | `column IS NULL` | — |
| `Not(value)` | `column != value` | — |
| `Any([a, b])` | `column = ANY(ARRAY[a, b])` | — |
| `ArrayContains([...])` / `ArrayContainedBy([...])` | for Postgres `text[]` etc. | — |
| `Raw(alias => \`…\${alias}…\`)` | escape hatch — your own SQL fragment | — |

Combine them naturally:

```ts
where: {
  isExplicit: true,
  durationSeconds: MoreThan(120),
  releaseDate: Between(new Date('2020-01-01'), new Date('2020-12-31')),
}
```

Full reference: [TypeORM — Find operators](https://typeorm.io/find-options#advanced-options).

### 8.4 Sorting — whitelist the column

```ts
order: { [sortBy]: sortDirection }
```

This works because TypeScript's computed-property syntax lets us use a variable as the key.

⚠️ **Never trust a raw `sortBy=<column>` query string.** Even with parameterized queries, the column name is treated as an IDENTIFIER in SQL and CANNOT be parameterized. The safest pattern, used here:

1. Define an `ArtistSortByFields` ENUM of allowed columns.
2. Validate the DTO with `@IsEnum(ArtistSortByFields)`.
3. Pass the validated value as the order key.

This kills "sort-by SQL injection" before the value reaches TypeORM.

### 8.5 Pagination — `skip` + `take` (or `findAndCount`)

```ts
const skip = (page - 1) * pageSize; // 1-indexed pages
const take = pageSize;

return this.artistRepository.find({ where, order, skip, take });
```

Use `findAndCount` if you also want the total — handy for "Page X of Y" UI:

```ts
const [items, total] = await this.artistRepository.findAndCount({
  where, order, skip, take,
});
return { items, total, page, pageSize };
```

**Performance gotcha:** `findAndCount` runs an extra `SELECT COUNT(*)` over the same filter, which is fine for small tables but expensive on huge ones. For high-traffic endpoints prefer keyset pagination (a.k.a. "seek pagination") with a `WHERE id < lastSeenId` clause.

### 8.6 Putting it all together

The shared DTO chain in this project:

```
PaginationDto                  // page, pageSize
  └── ArtistSearchQuery        // adds q, genre, sortBy, sortDirection
```

Inheriting from `PaginationDto` keeps every list endpoint consistent — `page`/`pageSize` are validated once and reused everywhere. You can build similar `…SearchQuery extends PaginationDto` classes for albums, songs, playlists, and so on.

**Read more:**
- [TypeORM — Find options](https://typeorm.io/find-options)
- [TypeORM — Find operators](https://typeorm.io/find-options#advanced-options)
- [Seek (keyset) pagination explained](https://use-the-index-luke.com/no-offset)

---

## 9. The Repository pattern — `Repository<T>`

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

## 10. Soft delete vs hard delete

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

## 11. The `@InjectRepository(Entity)` decorator

```ts
constructor(
  @InjectRepository(Album)
  private readonly albumRepository: Repository<Album>,
) {}
```

`@InjectRepository(X)` is just a thin wrapper around Nest's normal `@Inject('token')` — `@nestjs/typeorm` generates a unique provider token per entity. You don't need to know the token; the decorator handles it.

You can only inject a repository for an entity that's been registered with `TypeOrmModule.forFeature([X])` **in the same module** (or one that re-exports `TypeOrmModule.forFeature([X])`).

---

## 12. Synchronize vs migrations

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

## 13. QueryBuilder — when CRUD isn't enough

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

## 14. Transactions

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

## 15. Folder map for this lesson

| File | What to study |
|------|---------------|
| `src/db/database.module.ts` | `TypeOrmModule.forRoot` — connection options |
| `src/app.module.ts` | How `DatabaseModule` plugs into the root |
| `src/common/dto/pagination.dto.ts` | Reusable `PaginationDto` — extended by per-feature search DTOs |
| `src/common/types/sort-direction.ts` | `ASC` / `DESC` enum used by sortable list endpoints |
| `src/common/types/genre.ts` | Shared `Genre` enum used by the DB enum column and by query DTOs |
| `src/album/album.entity.ts` | `@Entity`, `@Column`, audit columns, `jsonb`, `@ManyToOne` to Artist, `@OneToMany` to Songs |
| `src/album/album.module.ts` | `TypeOrmModule.forFeature([Album, Artist])` — registering a read-only repo for FK validation |
| `src/album/album.service.ts` | `create` + `save`, `findOne` with relations, "spread merge" update, `softDelete`, FK validation |
| `src/song/song.entity.ts` | Two `@ManyToOne` relations + the INVERSE `@ManyToMany` to `Playlist` |
| `src/song/song.module.ts` | Three repos in one `forFeature(...)` |
| `src/song/song.service.ts` | `findOne({ where, relations })` and `update + reload` pattern |
| `src/artist/entitites/artist.entity.ts` | Postgres `enum` column, `simple-array`, `@OneToMany` × 2, inverse `@OneToOne` |
| `src/artist/entitites/artist-profile.entity.ts` | Owning `@OneToOne` with `@JoinColumn` |
| `src/artist/artist.module.ts` | Exporting a service for cross-module use, two entities under one module |
| `src/artist/artist.service.ts` | Two-table create flow, eager-loading the profile relation, **`getArtists` with `ILike` + `where` + `order` + `skip`/`take`** |
| `src/artist/dto/artist-search-query.dto.ts` | Search/sort/paginate DTO that EXTENDS `PaginationDto`; whitelisted sortable columns via enum |
| `src/playlist/entities/playlist.entity.ts` | **OWNING side of `@ManyToMany`** with explicit `@JoinTable({ name: 'playlist_songs' })` |
| `src/playlist/playlist.module.ts` | Registering a 2nd read-only repo (`Song`) for many-to-many population |
| `src/playlist/playlist.service.ts` | `In(...)` operator, set-replace pattern for junction tables |
| `src/playlist/playlist.controller.ts` | `PUT /playlist/:id/songs` — REST semantics for relation replacement |
| `src/playlist/dto/playlist-update-songs.dto.ts` | `@IsUUID('4', { each: true })` for arrays of UUIDs |

---

## 16. Try it yourself

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
# Create an artist (the profile is created in the same request via a nested object)
curl -X POST http://localhost:3000/artist \
  -H "Content-Type: application/json" \
  -d '{ "name": "Daft Punk", "genre": "electronic", "isActive": false, "profile": { "country": "FR" }, "debutYear": 1993 }'

# List them (defaults: page=1, pageSize=10, sortBy=createdAt, sortDirection=DESC)
curl http://localhost:3000/artist

# Search + filter + sort + paginate (see section 8)
curl "http://localhost:3000/artist?q=punk&genre=electronic&sortBy=name&sortDirection=ASC&page=1&pageSize=5"

# Create an album linked to that artist's id
curl -X POST http://localhost:3000/album \
  -H "Content-Type: application/json" \
  -d '{ "title": "Discovery", "artistId": "<artist-id>", "releaseDate": "2001-03-12T00:00:00Z" }'

# Create a song that belongs to the album above
curl -X POST http://localhost:3000/song \
  -H "Content-Type: application/json" \
  -d '{ "title": "One More Time", "durationSeconds": 320, "artistId": "<artist-id>", "albumId": "<album-id>" }'

# Many-to-many demo: create a playlist and PUT its full song list
curl -X POST http://localhost:3000/playlist \
  -H "Content-Type: application/json" \
  -d '{ "title": "Driving mix", "author": "me" }'

curl -X PUT "http://localhost:3000/playlist/<playlist-id>/songs" \
  -H "Content-Type: application/json" \
  -d '{ "songIds": ["<song-id-1>", "<song-id-2>"] }'

# Soft delete an album
curl -X DELETE http://localhost:3000/album/<album-id>

# Verify the row is hidden from /album but still in the DB:
# (in psql:  SELECT id, title, "deletedAt" FROM album;
#            SELECT * FROM playlist_songs;)  -- inspect the junction table
```

A Postman collection is also included: `SEDC_2026_Nest.postman_collection.json`.

---

## 17. Exercises

1. **Add an index.** Put `@Index()` on `Artist.genre` and watch what `synchronize: true` does to the schema.
2. **Make `Song.durationSeconds` strictly positive** with a `@Check("durationSeconds > 0")` constraint.
3. **Add `onDelete: 'CASCADE'`** to `Song.album` so deleting an album cleans up its songs. Verify the SQL change with `psql \d song`.
4. **Wrap `ArtistService.createArtist` in a transaction** using `dataSource.transaction(...)` so the artist + profile commit or roll back together.
5. **Reuse `PaginationDto`** in `AlbumService.findAll` and `SongService.getSongs`. Add `page`/`pageSize` query params and switch to `findAndCount` so the API returns `{ items, total, page, pageSize }`.
6. **Add an album-by-artist filter.** Build an `AlbumSearchQuery extends PaginationDto` with `artistId?: string` and `q?: string` (ILike on `title`). Wire it through the controller via `@Query()`.
7. **Add a delta endpoint for the playlist.** Implement `POST /playlist/:id/songs` (add) and `DELETE /playlist/:id/songs/:songId` (remove) using the **relation QueryBuilder** (`.relation(Playlist, 'songs').of(id).add(...)`). Compare the SQL with the existing PUT.
8. **Track playlist position.** Convert the `Playlist` ↔ `Song` link to the *junction-as-entity* pattern (`PlaylistSong { playlistId, songId, position }`) so songs can be ordered.
9. **Eager-load `Artist.profile`** with `{ eager: true }` and remove the explicit `relations: { profile: true }` from `getArtists`. Compare the SQL with the logger.
10. **Add a `featuringArtists` `@ManyToMany`** between `Song` and `Artist` (separate from the main `artist` relation). Add `@JoinTable({ name: 'song_featuring_artists' })` on the `Song` side and update the create flow to accept an array of artist IDs.
11. **Switch `synchronize` to `false`** and create a migration that adds an `albumCount` column to `Artist`.
12. **Move DB credentials into `.env`** using `@nestjs/config` and `TypeOrmModule.forRootAsync`.
13. **Fix the pagination quirk.** `ArtistService.getArtists` uses `skip = page * pageSize`, which means `page=1` skips 10 rows. Change it to `(page - 1) * pageSize` and update the default to `page = 1`.

---

## 18. Further reading

### Official
- [NestJS — Database (TypeORM)](https://docs.nestjs.com/techniques/database)
- [NestJS — Configuration (`@nestjs/config`)](https://docs.nestjs.com/techniques/configuration)
- [TypeORM — Documentation](https://typeorm.io/)
- [TypeORM — Entities](https://typeorm.io/entities)
- [TypeORM — Decorator reference](https://typeorm.io/decorator-reference)
- [TypeORM — Repository API](https://typeorm.io/repository-api)
- [TypeORM — Find options](https://typeorm.io/find-options)
- [TypeORM — Find operators (`ILike`, `In`, `Between`, …)](https://typeorm.io/find-options#advanced-options)
- [TypeORM — Relations](https://typeorm.io/relations)
- [TypeORM — Many-to-many relations](https://typeorm.io/many-to-many-relations)
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
