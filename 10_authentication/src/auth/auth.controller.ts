import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { User } from '../user/user.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'The user has been successfully registered.',
    type: User,
  })
  @ApiConflictResponse({
    description: 'Email is already in use.',
  })
  @Post('register')
  register(@Body() credentials: RegisterDto): Promise<User> {
    return this.authService.register(credentials);
  }
}
