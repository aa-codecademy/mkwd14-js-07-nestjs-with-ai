/** Boots Nest from `AppModule` — same pattern as earlier modules. */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that do not have any decorators
      forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to be objects typed according to their DTO classes
      transformOptions: { enableImplicitConversion: true }, // Allow primitive types to be automatically converted (e.g., string to number)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
