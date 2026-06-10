import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Class, type ClassDocument } from './schemas/class.schema';
import type { Model } from 'mongoose';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
  ) {}

  create(createClassDto: CreateClassDto): Promise<ClassDocument> {
    return this.classModel.create(createClassDto);
  }

  findAll(): Promise<ClassDocument[]> {
    return this.classModel.find();
  }

  remove(id: string) {
    return this.classModel.findOneAndDelete({ _id: id });
  }
}
