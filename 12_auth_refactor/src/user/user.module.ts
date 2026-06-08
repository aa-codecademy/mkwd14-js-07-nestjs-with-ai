import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';

/**
 * UserModule — owns the User entity and its service.
 *
 * WHY IS UserService EXPORTED?
 *   AuthModule needs to inject UserService into both AuthService (for creating
 *   users and verifying passwords) and JwtStrategy (for looking up users when
 *   validating tokens). Exporting UserService here makes it available to any
 *   module that imports UserModule.
 *
 *   Pattern: a module that owns a service exports it so other modules can use
 *   it without re-declaring the provider. The database connection and
 *   Repository<User> remain encapsulated inside UserModule — callers only see
 *   UserService's public methods.
 *
 * WHY IS THERE NO CONTROLLER?
 *   There are no public REST endpoints for users in this app — users are created
 *   and managed exclusively through the /auth/register endpoint in AuthModule.
 *   If we needed a GET /api/user/me endpoint later, we would add a UserController
 *   here and protect it with JwtAuthGuard.
 */
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UserService],
  exports: [UserService], // makes UserService injectable in AuthModule
})
export class UserModule {}
