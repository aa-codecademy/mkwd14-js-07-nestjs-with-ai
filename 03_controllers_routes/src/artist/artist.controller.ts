import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

interface Artist {
  id: number;
  name: string;
  genre: string;
}

@Controller('artist')
export class ArtistController {
  private artists: Artist[] = [
    {
      id: 1,
      name: 'The Beatles',
      genre: 'Rock',
    },
    {
      id: 2,
      name: 'Beyoncé',
      genre: 'Pop',
    },
    {
      id: 3,
      name: 'Miles Davis',
      genre: 'Jazz',
    },
    {
      id: 4,
      name: 'Eminem',
      genre: 'Hip Hop',
    },
    {
      id: 5,
      name: 'Daft Punk',
      genre: 'Electronic',
    },
  ];

  @Get()
  getAllArtists() {
    return this.artists;
  }

  // /localhost:3000/artist/1
  @Get(':id')
  getArtistById(@Param('id') id: string): Artist {
    console.log('Received ID:', id, typeof id); // Debugging log
    const artist = this.artists.find((artist) => artist.id === Number(id));

    if (!artist) {
      throw new NotFoundException(`Artist with ID ${id} not found`);
    }

    return artist;
  }
}
