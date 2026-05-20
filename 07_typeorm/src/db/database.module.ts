/**
 * Database (TypeORM) bootstrap module.
 *
 * This module is the single place where the application establishes a
 * connection to PostgreSQL. It is imported once from `AppModule` and the
 * resulting `DataSource` becomes available everywhere through dependency
 * injection.
 *
 * Mental model:
 *   AppModule
 *     └── DatabaseModule                        ← creates the connection
 *           └── TypeOrmModule.forRoot({...})    ← `DataSource` (one per app)
 *   Feature modules (Artist, Song, Album)
 *     └── TypeOrmModule.forFeature([Entity])    ← registers a `Repository<T>`
 *
 * `forRoot` vs `forFeature`:
 *   - `forRoot(...)`     → called ONCE in the root module. Builds the
 *                          `DataSource` (TypeORM's connection abstraction).
 *   - `forFeature([X])`  → called in each feature module. Registers the
 *                          repositories so they can be `@InjectRepository`'d.
 *
 * Docs:
 *   - https://docs.nestjs.com/techniques/database
 *   - https://typeorm.io/data-source
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ─── Driver ────────────────────────────────────────────────────────
      // `type` selects which database driver TypeORM should load. Supported
      // values include 'postgres', 'mysql', 'mariadb', 'sqlite', 'better-sqlite3',
      // 'mssql', 'oracle', 'mongodb', etc. Each driver has its own npm package
      // — here we need `pg` (already in package.json).
      type: 'postgres',

      // ─── Network ───────────────────────────────────────────────────────
      // `host` + `port` point at the running database server. In real apps
      // these come from environment variables (see `@nestjs/config` +
      // `ConfigService`) so the same code can target dev/staging/prod.
      host: 'localhost',
      port: 5433, // Use 5432 as default PostgreSQL port

      // ─── Credentials ───────────────────────────────────────────────────
      // NEVER commit real credentials. In production use environment
      // variables, a secrets manager (AWS Secrets Manager, GCP Secret
      // Manager, Doppler, 1Password CLI, …) or a Kubernetes Secret.
      username: 'postgres',
      password: 'postgres',

      // The logical database name inside the PostgreSQL server.
      database: 'music',

      // ─── Entity discovery ─────────────────────────────────────────────
      // Two ways to tell TypeORM which classes are entities:
      //   1. List them explicitly:  `entities: [Artist, Song, Album]`
      //   2. Let Nest auto-collect them as feature modules register them
      //      via `TypeOrmModule.forFeature([...])` — that's what we do.
      // `autoLoadEntities: true` is the idiomatic Nest pattern: feature
      // modules stay self-contained and you never have to touch this file
      // when you add a new entity.
      // entities: [],
      autoLoadEntities: true,

      // ─── Schema sync ───────────────────────────────────────────────────
      // `synchronize: true` makes TypeORM compare your entity classes with
      // the actual database schema on every app startup and ALTER tables to
      // match. Great for prototyping — TERRIBLE in production because:
      //   - it can DROP columns and lose data
      //   - it makes deployments non-deterministic
      //   - you lose any history of schema changes
      // In production use proper migrations:
      //   - https://typeorm.io/migrations
      //   - `typeorm migration:generate` to create one from entity diffs
      //   - `typeorm migration:run` to apply them
      synchronize: true, // Set to false in production

      // Other options you'll meet in real projects:
      //   logging: ['query', 'error']  // log SQL to the console
      //   ssl: { rejectUnauthorized: false }  // managed PG (Neon, Supabase, RDS)
      //   namingStrategy: new SnakeNamingStrategy()  // snake_case columns
      //   poolSize: 10                  // connection pool tuning
    }),
  ],
})
export class DatabaseModule {}
