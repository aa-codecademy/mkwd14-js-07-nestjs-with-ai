import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global request validation for all DTO-driven endpoints.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Prefix all REST controllers with /api (e.g. /api/artist, /api/song).
  app.setGlobalPrefix('api');

  // OpenAPI metadata used by Swagger UI and docs-json.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('MusicBox Application')
    .setDescription('API for music application')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'access-token',
    )
    .build();

  // Generate OpenAPI document from controller + DTO metadata.
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Swagger UI: /docs, raw OpenAPI JSON: /docs-json.
  SwaggerModule.setup('docs', app, swaggerDocument);

  // Serve static frontend assets from /public at runtime.
  app.useStaticAssets(join(__dirname, '..', 'public'));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
