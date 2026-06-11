import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // NestExpressApplication gives access to Express-specific APIs (e.g. static assets).
  // Using the generic NestApplication would hide those methods.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // All routes are prefixed with /api (e.g. GET /api/students).
  app.setGlobalPrefix('api');

  // Serve files from the /public folder at the root URL (for HTML clients, images, etc.)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Global ValidationPipe applies class-validator rules defined on every DTO.
  // whitelist: strips properties not declared in the DTO (defence against mass-assignment).
  // forbidNonWhitelisted: rejects the request instead of silently stripping unknown fields.
  // transform: converts plain JSON objects into DTO class instances so decorators work.
  // enableImplicitConversion: auto-converts route/query params to the declared TS type
  //   (e.g. string "42" → number 42) without needing @Type() on every field.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Register the custom logging interceptor globally so every HTTP request/response
  // is logged with method, URL, status code, and duration.
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger / OpenAPI — builds the spec from controller decorators and serves it
  // at /docs (interactive UI) and /docs-json (raw JSON schema).
  const openApi = new DocumentBuilder()
    .setTitle('Academy Gradebook')
    .setDescription('NestJS with Mongo & Mongoose integration')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, openApi);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
