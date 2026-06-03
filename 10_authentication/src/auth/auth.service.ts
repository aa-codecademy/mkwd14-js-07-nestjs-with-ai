import { BadRequestException, Injectable } from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import type { User } from '../user/user.entity';
import type { LoginDto } from './dto/login.dto';
import { LoggerService } from '../logger/logger.service';
import { JwtService } from '@nestjs/jwt';
import type { JwtPayload } from './types/jwt';
import { ConfigService } from '@nestjs/config/dist/config.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly logger: LoggerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  register(credentials: RegisterDto): Promise<User> {
    const user = this.userService.createUser(credentials);

    return user;
  }

  async login(credentials: LoginDto) {
    try {
      const user = await this.userService.getUserByEmail(credentials.email);

      const isPasswordValid =
        await this.userService.verifyPassword(credentials);

      if (!isPasswordValid) {
        throw new BadRequestException('Invalid credentials');
      }

      const payload: JwtPayload = { sub: user.id, username: user.email };

      const accessToken = await this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN'),
      });

      return { user, accessToken };
    } catch (error: unknown) {
      this.logger.error('AuthService | Login error:', JSON.stringify(error));
      throw new BadRequestException('Invalid credentials');
    }
  }
}
