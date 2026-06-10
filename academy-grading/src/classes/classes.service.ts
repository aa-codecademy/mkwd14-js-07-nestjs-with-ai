import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';

@Injectable()
export class ClassesService {
  create(createClassDto: CreateClassDto) {
    return 'This action adds a new class';
  }

  findAll() {
    return `This action returns all classes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} class`;
  }

  remove(id: number) {
    return `This action removes a #${id} class`;
  }
}
