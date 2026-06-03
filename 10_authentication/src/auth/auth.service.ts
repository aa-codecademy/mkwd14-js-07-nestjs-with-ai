import { Injectable } from '@nestjs/common';
import type { RegisterDto } from './dto/register.dto';
import { UserService } from '../user/user.service';
import type { User } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  register(credentials: RegisterDto): Promise<User> {
    const user = this.userService.createUser(credentials);

    return user;
  }
}
