import { PartialType } from '@nestjs/mapped-types';
import { ArtistCreateDto } from './artist-create.dto';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class ArtistPartialUpdateDto extends PartialType(ArtistCreateDto) {}

export class ArtistUpdateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @IsIn(['rock', 'pop', 'jazz', 'hip-hop', 'classical', 'electronic'])
  genre!: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;
}
