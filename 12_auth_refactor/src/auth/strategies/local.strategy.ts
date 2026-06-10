import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../../user/user.service';
import { User } from '../../user/user.entity';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly userService: UserService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    console.log('🚀 ~ LocalStrategy ~ validate ~ password:', password);
    console.log('🚀 ~ LocalStrategy ~ validate ~ email:', email);
    const isValid = await this.userService.verifyPassword({ email, password });

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.userService.getUserByEmail(email);
  }
}
