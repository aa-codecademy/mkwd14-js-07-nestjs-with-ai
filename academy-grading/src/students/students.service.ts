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

  findOne(id: string): Promise<any> {
    return this.studentModel.findOne({ _id: id });
  }

  async remove(id: string): Promise<void> {
    await this.studentModel.findOneAndDelete({ _id: id });
  }
}
