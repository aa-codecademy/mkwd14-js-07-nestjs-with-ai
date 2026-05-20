/**
 * Album feature module.
 *
 * `TypeOrmModule.forFeature([Album])` does two things:
 *   1. Tells the global `DataSource` (created in `DatabaseModule`) about the
 *      `Album` entity — combined with `autoLoadEntities: true` in
 *      `database.module.ts`, the table is added to the schema automatically.
 *   2. Registers a `Repository<Album>` provider inside this module's DI scope,
 *      which the service can grab with `@InjectRepository(Album)`.
 *
 * Rule of thumb: every entity should be declared in `forFeature` exactly once,
 * inside the module that owns the controller/service for that entity.
 */
import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { AlbumController } from './album.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Album } from './album.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Album])],
  controllers: [AlbumController],
  providers: [AlbumService],
})
export class AlbumModule {}
