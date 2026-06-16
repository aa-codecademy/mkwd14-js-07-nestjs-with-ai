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
  // @IsMongoId() validates the string is a 24-char hex MongoDB ObjectId.
  // It only checks the FORMAT — not whether the student actually exists in the DB.
  // The service calls studentsService.findOne() to confirm existence.
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

  // Dual validation for the grade value:
  //   1. @Min(1) / @Max(10) here — enforced at the HTTP layer by ValidationPipe.
  //   2. min: 1 / max: 10 on the schema @Prop — enforced by Mongoose before any DB write.
  // The DTO check happens first, so invalid values never reach Mongoose.
  @ApiProperty({
    description: 'The grade value (1-10)',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  value!: number;

  @ApiPropertyOptional({
    description: 'Optional notes about the grade',
    example: 'Great work! Minor improvements needed.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
