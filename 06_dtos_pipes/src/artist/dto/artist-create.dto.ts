import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class ArtistCreateDto {
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
