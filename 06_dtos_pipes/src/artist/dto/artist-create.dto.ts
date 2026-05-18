import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class ArtistProfileDto {
  @IsString()
  @Length(2, 60)
  country!: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @IsOptional()
  @IsEmail()
  bookingEmail?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  website?: string;
}

export class ArtistCreateDto {
  @IsString()
  @Length(1, 120)
  name!: string;

  @IsString()
  @IsIn(['rock', 'pop', 'jazz', 'hip-hop', 'classical', 'electronic'])
  genre!: string;

  @IsBoolean()
  isActive!: boolean;

  @ValidateNested()
  @Type(() => ArtistProfileDto)
  profile!: ArtistProfileDto;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  debutYear?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(2, 30, { each: true })
  aliases?: string[];
}
