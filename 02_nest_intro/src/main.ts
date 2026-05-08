/**
 * Entry point: creates the HTTP server and wires the dependency-injection container.
 *
 * NestFactory.create(AppModule) boots Nest using `AppModule` as the root module.
 * All other modules, controllers, and providers are registered through that tree.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // PORT can be set via environment (e.g. PORT=4000 npm run start); default is 3000.
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
