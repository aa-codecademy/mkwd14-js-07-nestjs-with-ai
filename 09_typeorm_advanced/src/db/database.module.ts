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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5433')),

        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),

        database: config.get<string>('DB_NAME', 'music'),

        autoLoadEntities: true,

        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
