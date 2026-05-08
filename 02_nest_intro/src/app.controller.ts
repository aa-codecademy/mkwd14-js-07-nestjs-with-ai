/**
 * Controllers define HTTP routes. Method decorators (`@Get`, `@Post`, …) map to
 * verbs and paths; parameter decorators (`@Param`, `@Body`) extract data from the request.
 *
 * Empty `@Controller()` prefix → routes are at the app root (e.g. `/`, `/info`).
 * Use `@Controller('api')` to group everything under `/api/...`.
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  Res,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  /** Constructor injection: Nest supplies `AppService` because it is a `provider` in `AppModule`. */
  constructor(private readonly appService: AppService) {}

  /** GET http://localhost:3000/ — delegates to the service layer. */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** GET http://localhost:3000/hello/:name — `:name` is a route parameter. */
  @Get('hello/:name')
  sayHello(@Param('name') name: string): string {
    return `Hello ${name}, from the NestJS App`;
  }

  /** GET http://localhost:3000/info — returning an object serializes as JSON. */
  @Get('info')
  serverInfo(): { type: string; description: string; isActive: boolean } {
    return {
      type: 'Nest JS server',
      description: 'This is a NEST JS server, using Express JS',
      isActive: true,
    };
  }

  /**
   * POST http://localhost:3000/user — JSON body is parsed and passed to `@Body()`.
   * In real apps you would validate with class-validator + DTO classes or Zod.
   */
  @Post('user')
  createUser(
    @Body()
    userInfo: {
      name: string;
      age: number;
      jobTitle: string;
      location: string;
    },
  ): { isCreated: boolean } {
    console.log('user info: ', userInfo);

    return {
      isCreated: true,
    };
  }

  /** PUT http://localhost:3000/user/:id — `:id` from the URL plus optional JSON body. */
  @Put('user/:id')
  editUser(
    @Param('id') id: string,
    @Body() userInfo: unknown,
  ): { isCreated: boolean } {
    console.log('user info: ', id, userInfo);

    return {
      isCreated: true,
    };
  }

  /**
   * GET http://localhost:3000/test — legacy Express-style `@Req()` / `@Res()`.
   * When you use `@Res()`, you take responsibility for sending the response;
   * Nest’s usual return-value → JSON shortcut is bypassed unless you opt in differently.
   */
  @Get('test')
  test(@Req() req, @Res() res: any) {
    console.log(req);

    res.json({ message: 'test response' });
  }
}
