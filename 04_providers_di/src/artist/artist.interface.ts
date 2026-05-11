export interface Artist {
  id: number;
  name: string;
  genre: string;
}

export type CreateArtist = Omit<Artist, 'id'>;
// type CreateArtist = Pick<Artist, 'name' | 'genre'>;

export type UpdateArtist = Omit<Artist, 'id'>;

export type PartiallyUpdateArtist = Partial<UpdateArtist>;
