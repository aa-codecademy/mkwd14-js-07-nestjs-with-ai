/**
 * Root module: registers every HTTP controller for this exercise.
 * No custom providers yet — artist data lives inside `ArtistController` (module 04 moves it to a service).
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ArtistController } from './artist/artist.controller';

@Module({
  imports: [],
  controllers: [AppController, ArtistController],
  providers: [],
})
export class AppModule {}
