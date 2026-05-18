import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';

const MILLISECONDS_IN_SECONDS = 60;
const SECONDS_IN_MINUTE = 60;

export class SongCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  featuringArtistsId!: string[];

  @IsInt()
  @IsPositive()
  @Max(MILLISECONDS_IN_SECONDS * SECONDS_IN_MINUTE * 5) // 5 minutes
  durationSeconds!: number;

  @IsOptional()
  @IsBoolean()
  isExplicit: boolean = false;

  @IsOptional()
  @IsUUID('4')
  albumId?: string;
}
