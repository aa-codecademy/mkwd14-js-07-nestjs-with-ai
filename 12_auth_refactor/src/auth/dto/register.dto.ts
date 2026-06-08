import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

/**
 * RegisterDto — the shape of data a user must send to create an account.
 *
 * DTOs (Data Transfer Objects) are plain classes whose only job is to describe
 * the expected shape AND validity rules of incoming request bodies.
 * NestJS's global ValidationPipe reads the class-validator decorators below
 * and rejects the request with 400 Bad Request before it even reaches the
 * controller if any rule fails.
 *
 * Why a separate DTO and not the User entity?
 *   The User entity is a database model. Exposing it directly as an input type
 *   would allow callers to set fields like `id`, `createdAt`, or `passwordHash`
 *   — a classic mass-assignment vulnerability. The DTO is a whitelist: only the
 *   fields declared here can enter the system.
 */
export class RegisterDto {
  // @IsEmail() validates the format (must contain "@" and a domain).
  // Accepting any random string as an email makes account recovery impossible
  // and lets bots register garbage data easily.
  @ApiProperty({ example: 'user@music.com' })
  @IsEmail()
  email!: string;

  // @IsStrongPassword enforces complexity rules at the point of registration.
  // Weak passwords are the #1 cause of account takeovers.
  // The rules below follow OWASP minimum recommendations:
  //   - 8+ characters (brute-force resistance)
  //   - at least one uppercase letter
  //   - at least one lowercase letter
  //   - at least one digit
  //   - at least one symbol
  //
  // NOTE: We never store this password. See UserService.createUser where it is
  // immediately hashed with bcrypt before it touches the database.
  @ApiProperty({ example: 'StrongPass1!' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;
}
