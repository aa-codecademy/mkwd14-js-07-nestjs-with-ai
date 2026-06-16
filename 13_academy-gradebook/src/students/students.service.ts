import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findOne(id: string): Promise<StudentDocument> {
    const student = await this.studentModel.findOne({ _id: id });

    if (!student) {
      throw new NotFoundException(`Student with ID: ${id} is not found`);
    }

    return student;
  }

  async remove(id: string): Promise<void> {
    await this.studentModel.findOneAndDelete({ _id: id });
  }
}
