import { IsArray, IsUUID } from 'class-validator';

export class PlaylistUpdateSongs {
  @IsArray()
  @IsUUID('4', { each: true })
  songIds!: string[];
}

// export class PlaylistUpdateSongs {
//   @IsOptional()
//   @IsUUID('4', { each: true })
//   songIdsToAdd?: string[];

//   @IsOptional()
//   @IsUUID('4', { each: true })
//   songIdsToRemove?: string[];
// }
