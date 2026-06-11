import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassName } from '../types/class';

export class CreateClassDto {
  @ApiProperty({
    description: 'The name of the class',
    example: ClassName.ANGULAR,
    enum: ClassName,
  })
  @IsEnum(ClassName)
  name!: ClassName;

  @ApiPropertyOptional({
    description: 'Optional description of the class',
    example: 'Advanced JavaScript concepts and best practices',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
