---
applyTo: ["src/**/*.entity.ts", "src/**/*.service.ts"]
---

# TypeORM Conventions — Copilot Instructions

These instructions apply to TypeORM entities and services in `src/`.

---

## Repository Injection

Inject a repository into a service using `@InjectRepository(Entity)`:

```typescript
// ✅ Correct
constructor(
  @InjectRepository(User) private readonly userRepository: Repository<User>,
) {}

// ❌ Wrong — DataSource is too low-level and bypasses the module system
constructor(private readonly dataSource: DataSource) {}
```

The entity class must be registered in its owning module's `TypeOrmModule.forFeature([Entity])` call.

---

## `select: false` Columns — Always Use QueryBuilder to Opt In

Several columns on the `User` entity have `{ select: false }`:

- `passwordHash`
- `refreshTokenHash` / `refreshTokenExpiry`
- `resetPasswordHash` / `resetPasswordExpiry`

Standard `find*` methods never include these columns. To read them:

```typescript
// ✅ Correct — explicitly includes the hidden column
const user = await this.userRepository
  .createQueryBuilder('user')
  .addSelect('user.passwordHash')
  .where('user.email = :email', { email })
  .getOne();

// ❌ Wrong — user.passwordHash will be undefined, bcrypt.compare will throw
const user = await this.userRepository.findOneBy({ email });
```

Call `.addSelect()` for each hidden column you need. If you need multiple hidden columns, chain multiple `.addSelect()` calls.

---

## QueryBuilder Parameter Binding

Always use named parameters — never string interpolation:

```typescript
// ✅ Correct — safe, parameterized query
.where('user.email = :email', { email: credentials.email })

// ❌ Wrong — SQL injection vulnerability
.where(`user.email = '${credentials.email}'`)
```

---

## Checking Expiry Before bcrypt.compare

When validating a refresh token or reset code, always check the expiry **before** calling `bcrypt.compare`. The bcrypt comparison is intentionally slow (~100 ms) — failing fast on an obviously expired token avoids unnecessary work:

```typescript
// ✅ Correct — cheap timestamp check first, expensive bcrypt second
if (user.refreshTokenExpiry < new Date()) {
  throw new ForbiddenException('Token expired');
}
const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);

// ❌ Wrong — runs bcrypt even when the token is obviously expired
const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
if (user.refreshTokenExpiry < new Date()) throw new ForbiddenException(...);
```

---

## UUIDs as Primary Keys

All entities use `@PrimaryGeneratedColumn('uuid')` instead of auto-increment integers:

```typescript
// ✅ Correct
@PrimaryGeneratedColumn('uuid')
id!: string;

// ❌ Wrong — sequential integers let attackers enumerate IDs
@PrimaryGeneratedColumn()
id!: number;
```

**Why UUIDs?** They are not guessable, they do not leak the total record count, and they work safely across distributed systems.

---

## Nullable Columns

Use `nullable: true` only for genuinely optional fields. Set defaults where the column must always have a value:

```typescript
// ✅ Correct — role always has a value, reset hash is optional
@Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
role!: UserRole;

@Column({ type: 'text', nullable: true, select: false })
resetPasswordHash!: string | null;
```

---

## Timestamps

Use TypeORM's built-in decorators for audit columns:

```typescript
@CreateDateColumn()
createdAt!: Date;

@UpdateDateColumn()
updatedAt!: Date;
```

These are managed automatically — never set them manually.

---

## update() vs save()

Use `repository.update(id, partialEntity)` for partial updates — it only issues a `SET` clause for the fields you pass:

```typescript
// ✅ Correct — targeted update, only changes what you specify
await this.userRepository.update(userId, {
  refreshTokenHash: hashedToken,
  refreshTokenExpiry: expiry,
});

// ❌ Avoid for partial updates — loads then saves the whole entity unnecessarily
const user = await this.userRepository.findOneBy({ id: userId });
user.refreshTokenHash = hashedToken;
await this.userRepository.save(user);
```

Use `repository.save()` when inserting a new entity (`repository.create()` + `repository.save()`) or when you need to trigger lifecycle hooks.

---

## Avoiding N+1 Queries

Use `createQueryBuilder` with `.leftJoinAndSelect()` when you need related entities in one query:

```typescript
// ✅ Correct — single query with JOIN
const playlist = await this.playlistRepository
  .createQueryBuilder('playlist')
  .leftJoinAndSelect('playlist.songs', 'song')
  .where('playlist.id = :id', { id })
  .getOne();

// ❌ Avoid — triggers a separate query for each playlist when loading songs
const playlists = await this.playlistRepository.find();
for (const p of playlists) {
  p.songs = await this.songRepository.findBy({ playlistId: p.id }); // N queries
}
```

---

## Entity Relationships

Use string form for `@OneToMany` / `@ManyToOne` when circular imports are a risk:

```typescript
// ✅ Safe — avoids circular import between User and Playlist
@OneToMany('Playlist', 'owner')
playlists!: Playlist[];

// May cause circular-import issues in large graphs
@OneToMany(() => Playlist, playlist => playlist.owner)
playlists!: Playlist[];
```

This is already the pattern used in `User` entity — follow it consistently.
