import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegisterDto } from '../auth/dto/register.dto';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../auth/dto/login.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async getUserByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

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

  async verifyPassword(credentials: LoginDto): Promise<boolean> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: credentials.email.toLowerCase() })
      .getOne();

    if (!user) return false;

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash,
    );

    return isPasswordValid;
  }
}

// ivo.kostovski@gmail.com
// ivokostovski@gmail.com
// Ivo.Kostovski@gmail.com
