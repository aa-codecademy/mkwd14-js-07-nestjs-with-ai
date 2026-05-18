/**
 * Application bootstrap.
 *
 * The most important thing that happens here for this lesson is registering a
 * GLOBAL `ValidationPipe`. After this is registered, every `@Body()`,
 * `@Param()` and `@Query()` argument bound to a DTO is automatically:
 *
 *   1. transformed into an instance of that DTO class, and
 *   2. validated against the `class-validator` decorators on that class.
 *
 * If validation fails, Nest throws `BadRequestException` (HTTP 400) and the
 * controller method is never invoked.
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /**
   * Global `ValidationPipe` — runs for every route in the app.
   *
   * Alternative scopes (smaller blast radius) you could use instead:
   *   - parameter level:   `@Body(new ValidationPipe()) dto: CreateDto`
   *   - method level:      `@UsePipes(new ValidationPipe())` on a handler
   *   - controller level:  `@UsePipes(new ValidationPipe())` on a class
   *
   * Going global is the most common pattern for REST APIs because it makes
   * validation uniform across the whole application.
   */
  app.useGlobalPipes(
    new ValidationPipe({
      /**
       * `whitelist: true` — strip any property from the incoming payload that
       * does NOT have a validation decorator on the matching DTO field.
       *
       * Example: client sends `{ name: "Ana", isAdmin: true }` but the DTO
       * only declares `name`. With whitelist enabled, the controller receives
       * `{ name: "Ana" }` — the rogue `isAdmin` field is silently removed.
       *
       * This is a simple but powerful defense against mass-assignment bugs.
       */
      whitelist: true,

      /**
       * `forbidNonWhitelisted: true` — go one step further and REJECT the
       * request (400) if it contains any unknown field, instead of just
       * stripping it. Use it when you want strict, contract-first APIs.
       */
      forbidNonWhitelisted: true,

      /**
       * `transform: true` — convert the plain JSON object into a real
       * instance of the DTO class (`body instanceof CreateUserDto === true`).
       *
       * This is REQUIRED for:
       *   - `@Type(() => Date)` and similar type hints to work
       *   - default values declared in the class to apply
       *   - `enableImplicitConversion` (below) to do its thing
       */
      transform: true,

      /**
       * `enableImplicitConversion: true` — let `class-transformer` coerce
       * primitive values based on the TypeScript type of the field.
       *
       * Useful especially for query strings and route params, which arrive as
       * strings in HTTP:
       *   - "42"   -> 42      for a `number` field
       *   - "true" -> true    for a `boolean` field
       *
       * Without this option you would need `@Type(() => Number)` on each
       * numeric query field. With it, the type annotation alone is enough.
       */
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
