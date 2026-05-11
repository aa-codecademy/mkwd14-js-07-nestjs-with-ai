import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArtistController } from './artist/artist.controller';

@Module({
  imports: [],
  controllers: [AppController, ArtistController],
  providers: [],
})
export class AppModule {}
