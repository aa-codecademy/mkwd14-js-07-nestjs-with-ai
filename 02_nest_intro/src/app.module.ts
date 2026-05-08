/**
 * Root module: declares which pieces belong to this feature area.
 *
 * - `imports`: other modules whose exports you need (empty here).
 * - `controllers`: classes that handle HTTP routes (`@Controller`).
 * - `providers`: injectable services (`@Injectable`) — Nest creates one shared instance
 *   per provider by default (singleton in the module scope).
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
