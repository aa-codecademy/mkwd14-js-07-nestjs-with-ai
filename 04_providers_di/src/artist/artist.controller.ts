import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ArtistService } from './artist.service';
import type {
  Artist,
  CreateArtist,
  PartiallyUpdateArtist,
  UpdateArtist,
} from './artist.interface';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistsService: ArtistService) {}

  @Get()
  getAllArtists(): Artist[] {
    return this.artistsService.getAllArtists();
  }

  // /localhost:3000/artist/search?genre=Rock
  @Get('search')
  search(@Query('genre') genre: string): Artist[] {
    console.log('Received genre:', genre);
    return this.artistsService.search(genre);
  }

  // /localhost:3000/artist/1
  @Get(':id')
  getArtistById(@Param('id') id: string): Artist {
    console.log('Received ID:', id, typeof id); // Debugging log
    return this.artistsService.getArtistById(id);
  }

  @Post()
  createArtist(@Body() body: CreateArtist): Artist {
    return this.artistsService.createArtist(body);
  }

  @Put(':id')
  updateArtist(@Param('id') id: string, @Body() body: UpdateArtist) {
    return this.artistsService.updateArtist(id, body);
  }

  @Patch(':id')
  partiallyUpdateArtist(
    @Param('id') id: string,
    @Body() body: PartiallyUpdateArtist,
  ) {
    return this.artistsService.partiallyUpdateArtist(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArtist(@Param('id') id: string): void {
    this.artistsService.deleteArtist(id);
  }
}
