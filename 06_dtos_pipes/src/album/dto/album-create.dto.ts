import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

class AlbumEditionDto {
  @IsString()
  @Length(2, 40)
  format!: string;

  @IsInt()
  @IsPositive()
  copies!: number;

  @IsBoolean()
  isLimited!: boolean;
}

export class AlbumCreateDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsUUID('4')
  artistId!: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  releaseDate?: Date;

  @IsArray()
  @ArrayNotEmpty()
  @Type(() => AlbumEditionDto)
  @ValidateNested({ each: true })
  editions!: AlbumEditionDto[];
}
