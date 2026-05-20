import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5433, // Use 5432 as default PostgreSQL port
      username: 'postgres',
      password: 'postgres',
      database: 'music',
      // entities: [],
      autoLoadEntities: true,
      synchronize: true, // Set to false in production
    }),
  ],
})
export class DatabaseModule {}
