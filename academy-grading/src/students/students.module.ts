import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Student, StudentSchema } from './schemas/student.schema';

@Module({
  imports: [
    // Registers the Student Mongoose model for this module scope.
    // After this, StudentsService can inject Model<StudentDocument> with
    // @InjectModel(Student.name) — NestJS DI handles the rest.
    MongooseModule.forFeature([{ name: Student.name, schema: StudentSchema }]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
