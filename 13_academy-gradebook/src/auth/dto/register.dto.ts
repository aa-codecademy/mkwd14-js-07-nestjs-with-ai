import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'The username for the new account, minimum 4 characters',
  })
  @IsString()
  @MinLength(4)
  username!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description:
      'A strong password with uppercase, lowercase, numbers and special characters',
  })
  @IsString()
  @IsStrongPassword()
  password!: string;
}
