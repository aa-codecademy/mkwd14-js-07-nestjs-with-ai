import {
  IsEmail,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// A DTO (Data Transfer Object) defines the exact shape of data expected in a request body.
// class-validator decorators (@IsString, @IsEmail, etc.) run at the HTTP layer via
// ValidationPipe before the controller method is ever called. If any rule fails, NestJS
// automatically returns a 400 Bad Request with a descriptive error message.
//
// @ApiProperty / @ApiPropertyOptional generate the JSON Schema shown in Swagger UI,
// so documentation is always in sync with the actual validation rules.
export class CreateStudentDto {
  // @IsString() — rejects the request if the value is not a string (e.g. a number).
  // @MinLength / @MaxLength — length bounds enforced before the value reaches the DB.
  // @ApiProperty — marks this field as required in the Swagger spec.
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

  // @IsEmail() validates the RFC 5322 email format (user@domain.tld).
  @ApiProperty({
    description: 'The email address of the student',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  // @IsOptional() tells class-validator to skip all following decorators if the field
  // is absent or undefined — so the request is still valid without a phone number.
  // @IsPhoneNumber('MK') validates the E.164 format for Macedonian numbers (+389...).
  // @ApiPropertyOptional marks this as an optional field in Swagger.
  @ApiPropertyOptional({
    description: 'Optional phone number of the student',
    example: '+38970223305',
  })
  @IsOptional()
  @IsPhoneNumber('MK')
  phoneNumber?: string;
}
