import {
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHomeworkDto {
  @ApiProperty({
    description: 'The title of the homework assignment',
    example: 'TypeScript Basics Assignment',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    description: 'Optional description of the homework',
    example: 'Complete exercises 1-5 in the TypeScript handbook',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the associated class',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  class!: string;
}
