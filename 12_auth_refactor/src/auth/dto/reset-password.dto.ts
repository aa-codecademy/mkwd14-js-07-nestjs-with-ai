import { ApiProperty } from '@nestjs/swagger';
import { IsStrongPassword, IsUUID } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Secret code in UUID format' })
  @IsUUID()
  code!: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  newPassword!: string;
}
