import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Grade, type GradeDocument } from './schemas/grade.schema';
import type { Model } from 'mongoose';
import { CreateGradeDto } from './dto/create-grade.dto';
import { StudentsService } from '../students/students.service';
import { HomeworksService } from '../homeworks/homeworks.service';
import type { Types } from 'mongoose';

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

  async findByStudent(id: Types.ObjectId) {
    await this.studentsService.findOne(id.toString());
    return this.gradeModel
      .find({ student: id.toString() })
      .populate('student', 'firstName lastName email')
      .sort({ value: -1 })
      .exec();
  }

  async findByHomework(id: Types.ObjectId) {
    await this.homeworksService.findOne(id.toString());

    return this.gradeModel
      .find({ homework: id.toString() })
      .populate('student', 'firstName lastName email')
      .sort({ value: -1 })
      .exec();
  }

  async averageForStudent(id: Types.ObjectId) {
    await this.studentsService.findOne(id.toString());

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [result] = await this.gradeModel.aggregate([
      { $match: { student: id.toString() } },
      {
        $group: {
          _id: '$student',
          average: { $avg: '$value' },
          count: { $sum: 1 },
        },
      },
    ]);
    console.log('🚀 ~ GradesService ~ averageForStudent ~ result:', result);

    if (!result) {
      throw new NotFoundException('Issue while getting student report');
    }

    return {
      studentId: id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      average: result.average ? Math.round(result.average * 100) / 100 : 0,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      count: result.count ? result.count : 0,
    };
  }

  async remove(id: string): Promise<void> {
    await this.gradeModel.findByIdAndDelete(id);
  }
}
