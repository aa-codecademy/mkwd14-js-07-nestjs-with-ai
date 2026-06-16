import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Class, type ClassDocument } from './schemas/class.schema';
import type { Model } from 'mongoose';

@Injectable()
export class ClassesService {
  // @InjectModel(Class.name) is the NestJS/Mongoose DI token that resolves to the
  // Mongoose Model registered by MongooseModule.forFeature() in ClassesModule.
  // Model<ClassDocument> gives you typed access to all Mongoose static methods:
  // find(), findOne(), create(), findOneAndDelete(), aggregate(), etc.
  constructor(
    @InjectModel(Class.name) private readonly classModel: Model<ClassDocument>,
  ) {}

  // Model.create() builds a new document, runs schema validators, and inserts it
  // in one step. Returns the saved HydratedDocument including the auto-generated _id.
  create(createClassDto: CreateClassDto): Promise<ClassDocument> {
    return this.classModel.create(createClassDto);
  }

  // Model.find() with no arguments returns all documents in the collection.
  // Returns a Mongoose Query that resolves to an array of HydratedDocuments.
  findAll(): Promise<ClassDocument[]> {
    return this.classModel.find();
  }

  async findOne(id: string): Promise<ClassDocument> {
    const cls = await this.classModel.findById(id).exec();

    if (!cls) {
      throw new NotFoundException(`Class with ID: ${id} doesn't exist`);
    }

    return cls;
  }

  // findOneAndDelete() atomically finds the matching document and removes it,
  // returning the deleted document (or null if not found). Using { _id: id }
  // as the filter lets Mongoose cast the string to ObjectId automatically.
  remove(id: string) {
    return this.classModel.findOneAndDelete({ _id: id });
  }
}
