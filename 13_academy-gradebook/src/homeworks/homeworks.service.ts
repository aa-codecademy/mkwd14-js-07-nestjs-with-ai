import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Homework, type HomeworkDocument } from './schemas/homework.schema';
import { type Model, Types } from 'mongoose';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class HomeworksService {
  constructor(
    @InjectModel(Homework.name)
    private readonly homeworkModel: Model<HomeworkDocument>,
    // ClassesService is injected here because HomeworksModule imports ClassesModule.
    // This lets us validate that the referenced class actually exists before saving.
    private readonly classService: ClassesService,
  ) {}

  async create(
    createHomeworkDto: CreateHomeworkDto,
  ): Promise<HomeworkDocument> {
    // Validate the class exists before creating the homework.
    // classService.findOne() throws NotFoundException if the class is not found,
    // which automatically returns a 404 to the client — no extra try/catch needed.
    await this.classService.findOne(createHomeworkDto.class);

    const homework = await this.homeworkModel.create(createHomeworkDto);

    // .populate('class', 'name description') replaces the stored ObjectId with the
    // actual Class document, but only returns the 'name' and 'description' fields.
    // This way the response contains readable class data, not just a raw ObjectId.
    return homework.populate('class', 'name description');
  }

  findAll(): Promise<HomeworkDocument[]> {
    return this.homeworkModel
      .find()
      // Populate the 'class' reference on every returned document.
      .populate('class', 'name description')
      // sort({ createdAt: -1 }) orders results newest-first (-1 = descending).
      // createdAt is auto-managed by Mongoose because the schema uses timestamps: true.
      .sort({ createdAt: -1 });
  }

  async findByClass(classId: Types.ObjectId): Promise<HomeworkDocument[]> {
    // Confirm the class exists first — if not, findOne throws 404.
    await this.classService.findOne(classId.toString());

    // Filter homeworks where the 'class' ObjectId matches the given classId.
    // Mongoose automatically casts the string to ObjectId when querying.
    return this.homeworkModel
      .find({ class: classId.toString() })
      .populate('class', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<HomeworkDocument> {
    const homework = await this.homeworkModel.findById(id).exec();

    if (!homework) {
      throw new NotFoundException(`Homework with ID ${id} doesn't exist.`);
    }

    return homework;
  }

  // findByIdAndDelete() is an atomic find-and-remove — no separate fetch needed.
  // Returns void because the HTTP handler returns 204 No Content (no body expected).
  async remove(id: string): Promise<void> {
    await this.homeworkModel.findByIdAndDelete(id).exec();
  }
}
