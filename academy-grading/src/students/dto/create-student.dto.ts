import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    description: 'The first name of the student',
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    description: 'The last name of the student',
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    description: 'The email address of the student',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({
    description: 'Optional phone number of the student',
    example: '+38970223305',
  })
  @IsOptional()
  @IsPhoneNumber('MK')
  phoneNumber?: string;
}
