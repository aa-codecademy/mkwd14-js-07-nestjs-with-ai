import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassName } from '../types/class';

export class CreateClassDto {
  // @IsEnum(ClassName) rejects any value not present in the ClassName enum.
  // This is enforced at the HTTP layer (before the service) so invalid class
  // names never reach the database. Passing `enum: ClassName` to @ApiProperty
  // renders a dropdown of valid values in Swagger UI, making the API self-documenting.
  @ApiProperty({
    description: 'The name of the class',
    example: ClassName.ANGULAR,
    enum: ClassName,
  })
  @IsEnum(ClassName)
  name!: ClassName;

  // @IsOptional() lets the request succeed without a description.
  // @MaxLength(500) prevents extremely long strings from being stored.
  @ApiPropertyOptional({
    description: 'Optional description of the class',
    example: 'Advanced JavaScript concepts and best practices',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
