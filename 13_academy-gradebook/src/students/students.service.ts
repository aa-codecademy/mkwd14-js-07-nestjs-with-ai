import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStudentDto } from './dto/create-student.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Student, type StudentDocument } from './schemas/student.schema';
import type { Model } from 'mongoose';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
  ) {}

  async create(createStudentDto: CreateStudentDto) {
    // Explicit duplicate check before insert. The schema already has unique:true on
    // email, so MongoDB would throw an E11000 duplicate key error on its own — but
    // catching that raw driver error and mapping it to a clean 409 ConflictException
    // here gives the API consumer a predictable, readable error response.
    const exists = await this.studentModel.findOne({
      email: createStudentDto.email,
    });

    if (exists) {
      throw new ConflictException(
        `Student with email: ${createStudentDto.email} already exists`,
      );
    }

    return this.studentModel.create(createStudentDto);
  }

  findAll() {
    return this.studentModel.find();
  }

  // findOne with { _id: id } — Mongoose automatically casts the string id to
  // ObjectId before querying, so no manual `new Types.ObjectId(id)` is needed.
  findOne(id: string): Promise<any> {
    return this.studentModel.findOne({ _id: id });
  }

  async remove(id: string): Promise<void> {
    await this.studentModel.findOneAndDelete({ _id: id });
  }
}
