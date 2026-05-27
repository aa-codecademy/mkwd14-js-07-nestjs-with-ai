import { IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Genre } from '../../common/types/genre';
import { SortDirection } from '../../common/types/sort-direction';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ArtistSortByFields {
  debutYear = 'debutYear',
  isActive = 'isActive',
  genre = 'genre',
  name = 'name',
  createdAt = 'createdAt',
}

export class ArtistSearchQuery extends PaginationDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  q?: string;

  @IsOptional()
  @IsEnum(Genre)
  genre?: Genre;

  @IsOptional()
  @IsEnum(ArtistSortByFields)
  sortBy: ArtistSortByFields = ArtistSortByFields.createdAt;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.DESC;
}
