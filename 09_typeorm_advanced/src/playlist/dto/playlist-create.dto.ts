import { IsString, Length } from 'class-validator';

export class PlaylistCreateDto {
  @IsString()
  @Length(1, 20)
  title!: string;

  @IsString()
  @Length(1, 50)
  author!: string;
}
