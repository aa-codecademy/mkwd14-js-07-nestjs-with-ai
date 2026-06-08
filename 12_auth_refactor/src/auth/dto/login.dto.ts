import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * LoginDto — the credentials a user sends to obtain a JWT access token.
 *
 * Login is intentionally less strict than RegisterDto:
 *   - We do NOT re-run @IsStrongPassword here. The password that already
 *     exists in the DB was validated at registration. Requiring complexity on
 *     login would break existing users if rules ever change, and would return
 *     confusing "weak password" errors when the real problem is a typo.
 *   - @IsString is enough — we just need a non-empty string to pass to bcrypt.
 *
 * What happens with this data after validation?
 *   → AuthService.login receives it → calls UserService.verifyPassword which
 *   runs bcrypt.compare → if valid, signs a JWT → returns { user, accessToken }.
 *   The raw password is NEVER stored, logged, or sent anywhere else.
 */
export class LoginDto {
  @ApiProperty({ example: 'user@music.com' })
  @IsEmail()
  email!: string;

  // @IsString (not @IsStrongPassword) — we don't enforce complexity on login,
  // only on registration. See the class-level comment above.
  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  password!: string;
}
