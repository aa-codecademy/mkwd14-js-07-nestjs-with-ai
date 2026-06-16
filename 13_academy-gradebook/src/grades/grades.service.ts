import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Grade, type GradeDocument } from './schemas/grade.schema';
import type { Model } from 'mongoose';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { StudentsService } from '../students/students.service';
import { HomeworksService } from '../homeworks/homeworks.service';

@Injectable()
export class GradesService {
  constructor(
    @InjectModel(Grade.name)
    private readonly gradeModel: Model<GradeDocument>,
    // These services are injected because GradesModule imports StudentsModule
    // and HomeworksModule — both of which export their respective services.
    private readonly studentsService: StudentsService,
    private readonly homeworksService: HomeworksService,
  ) {}

  async create(createGradeDto: CreateGradeDto): Promise<GradeDocument> {
    // Validate both the student and homework exist before creating the grade.
    // Each findOne() throws NotFoundException (404) if the entity is missing,
    // so the grade is never saved with a dangling reference.
    await this.studentsService.findOne(createGradeDto.student);
    await this.homeworksService.findOne(createGradeDto.homework);

    // Prevent a student from receiving more than one grade per homework assignment.
    // The schema has no compound unique index, so this check is done in application code.
    const existingGrade = await this.gradeModel
      .findOne({
        student: createGradeDto.student,
        homework: createGradeDto.homework,
      })
      .exec();
    if (existingGrade) {
      throw new ConflictException(
        `Grade for student ${createGradeDto.student} and homework ${createGradeDto.homework} already exists`,
      );
    }

    // Insert the grade, then populate both 'student' and 'homework' references so the
    // response contains full documents instead of raw ObjectIds.
    const grade = await this.gradeModel.create(createGradeDto);
    return grade.populate('student homework');
  }

  // Populate both references in a single query — Mongoose fetches Student and Homework
  // documents in parallel and attaches them to the returned grade objects.
  findAll(): Promise<GradeDocument[]> {
    return this.gradeModel.find().populate('homework student').exec();
  }

  remove(id: number) {
    return `This action removes a #${id} grade`;
  }
}
