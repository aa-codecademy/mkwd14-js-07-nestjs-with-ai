import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@music.com' })
  @IsEmail()
  email!: string;

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
