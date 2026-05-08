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
  constructor(private readonly appService: AppService) {}

  // localhost:3000/
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // localhost:3000/hello
  @Get('hello/:name')
  sayHello(@Param('name') name: string): string {
    return `Hello ${name}, from the NestJS App`;
  }

  @Get('info')
  serverInfo(): { type: string; description: string; isActive: boolean } {
    return {
      type: 'Nest JS server',
      description: 'This is a NEST JS server, using Express JS',
      isActive: true,
    };
  }

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

  @Get('test')
  test(@Req() req, @Res() res: any) {
    console.log(req);

    res.json({ message: 'test response' });
  }
}
