/**
 * Artist HTTP API — **thin controller**: validation of HTTP shapes only; persistence lives in `ArtistService`.
 * Inject the service via the constructor; Nest resolves it from `AppModule.providers`.
 */
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
import { ArtistCreateDto } from './dto/artist-create.dto';
import { ArtistDto } from './dto/artist.dto';
import {
  ArtistPartialUpdateDto,
  ArtistUpdateDto,
} from './dto/artist-update.dto';

@Controller('artist')
export class ArtistController {
  constructor(private readonly artistsService: ArtistService) {}

  /** Delegates list retrieval to the service layer. */
  @Get()
  getAllArtists(): ArtistDto[] {
    return this.artistsService.getAllArtists();
  }

  /** Query-string filter — implementation details stay in `ArtistService.search`. */
  @Get('search')
  search(@Query('genre') genre: string): ArtistDto[] {
    console.log('Received genre:', genre);
    return this.artistsService.search(genre);
  }

  /** `:id` binding — service throws `NotFoundException` when missing. */
  @Get(':id')
  getArtistById(@Param('id') id: string): ArtistDto {
    console.log('Received ID:', id, typeof id); // Debugging log
    return this.artistsService.getArtistById(id);
  }

  /** Creates an artist; server assigns `id` inside the service using the injected ID generator. */
  @Post()
  createArtist(@Body() body: ArtistCreateDto): ArtistDto {
    return this.artistsService.createArtist(body);
  }

  /** Full replacement of name/genre for one id. */
  // @Put(':id')
  // updateArtist(
  //   @Param('id') id: string,
  //   @Body() body: ArtistUpdateDto,
  // ): ArtistDto {
  //   return this.artistsService.updateArtist(id, body);
  // }

  /** Partial merge — unchanged fields stay as stored on the server. */
  @Patch(':id')
  partiallyUpdateArtist(
    @Param('id') id: string,
    @Body() body: ArtistPartialUpdateDto,
  ): ArtistDto {
    return this.artistsService.partiallyUpdateArtist(id, body);
  }

  /** 204 No Content on success — mirrors REST conventions from module 03. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteArtist(@Param('id') id: string): void {
    this.artistsService.deleteArtist(id);
  }
}
