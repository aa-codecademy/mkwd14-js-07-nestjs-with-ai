import {
  IsInt,
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

  @IsUUID('4')
  artistId!: string;

  @IsInt()
  @IsPositive()
  @Max(MILLISECONDS_IN_SECONDS * SECONDS_IN_MINUTE * 5) // 5 minutes
  durationSeconds!: number;
}
