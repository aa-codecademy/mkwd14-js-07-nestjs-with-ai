---
applyTo: "**/src/**/*.module.ts"
---

# Module conventions

Each feature is wired in its own `@Module`.

- Feature module template:
  ```ts
  @Module({
    imports: [MongooseModule.forFeature([{ name: Entity.name, schema: EntitySchema }])],
    controllers: [EntityController],
    providers: [EntityService],
    exports: [EntityService], // only if another module injects it
  })
  export class EntityModule {}
  ```
- Register persistence with `forFeature` here (Mongoose) — not in `AppModule`.
- `AppModule` composes the app: `ConfigModule.forRoot({ isGlobal: true })`, the DB connection via
  `MongooseModule.forRootAsync` (inject `ConfigService`, `uri: config.getOrThrow('MONGODB_URI')`),
  then the feature modules.
- Only `export` a provider when another module depends on it; keep the surface minimal.
- Global concerns (`ValidationPipe`, interceptors, session middleware, Swagger, static assets)
  are configured in `main.ts`, not in modules.
