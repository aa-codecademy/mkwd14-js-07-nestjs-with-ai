/**
 * Application services hold business logic and shared behavior.
 *
 * `@Injectable()` registers this class with Nest’s DI container so controllers
 * (and other providers) can receive it via constructor injection.
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
