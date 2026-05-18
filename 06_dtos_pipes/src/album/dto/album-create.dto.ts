import {
  IsInt,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  Max,
} from 'class-validator';

export class AlbumCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsUUID('4')
  artistId!: string;

  @IsInt()
  @IsPositive()
  @Max(new Date().getFullYear())
  year!: number;
}
