import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import type { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  register(credentials: RegisterDto) {
    return this.userService.create(credentials);
  }

  async login(credentials: LoginDto) {
    const user = await this.userService.findByUsername(credentials.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const arePasswordsMatching = await user.comparePassword(
      credentials.password,
    );

    if (!arePasswordsMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return { username: user.username };
  }
}
