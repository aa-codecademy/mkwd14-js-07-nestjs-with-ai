import { ConflictException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async createUser(credentials: RegisterDto): Promise<User> {
    const email = credentials.email.toLowerCase();

    const existingUser = await this.userRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Cost 10 is the OWASP-recommended minimum and keeps bcrypt from blocking
    const passwordHash = await bcrypt.hash(credentials.password, 10);

    const user = this.userRepository.create({
      email,
      passwordHash,
    });

    const createdUser = await this.userRepository.save(user);

    return createdUser;
  }
}

// ivo.kostovski@gmail.com
// ivokostovski@gmail.com
// Ivo.Kostovski@gmail.com
