import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, type UserDocument } from './schemas/user.schema';
import type { Model } from 'mongoose';
import type { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(credentials: RegisterDto) {
    const existing = await this.userModel.findOne({
      username: credentials.username.toLowerCase(),
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    const user = new this.userModel(credentials);

    return user.save();
  }

  findByUsername(username: string) {
    return this.userModel
      .findOne({
        username: username.toLowerCase(),
      })
      .select('*password')
      .exec();
  }
}
