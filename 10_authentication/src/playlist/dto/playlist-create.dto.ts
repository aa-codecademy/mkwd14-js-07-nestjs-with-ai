import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class PlaylistCreateDto {
  @IsString()
  @Length(1, 20)
  @ApiProperty({ example: 'Roadtrip' })
  title!: string;

  @IsString()
  @Length(1, 50)
  @ApiProperty({ example: 'Dawn Wilson' })
  author!: string;
}
