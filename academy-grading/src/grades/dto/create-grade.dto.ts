import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateGradeDto {
  @ApiProperty({
    description: 'MongoDB ObjectId of the student',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  student!: string;

  @ApiProperty({
    description: 'MongoDB ObjectId of the homework',
    example: '507f1f77bcf86cd799439012',
  })
  @IsMongoId()
  homework!: string;

  @ApiProperty({
    description: 'The grade value (0-100)',
    example: 95,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  value!: number;

  @ApiPropertyOptional({
    description: 'Optional notes about the grade',
    example: 'Great work! Minor improvements needed.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
