import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Grade, GradeSchema } from './schemas/grade.schema';
import { StudentsModule } from '../students/students.module';
import { HomeworksModule } from '../homeworks/homeworks.module';

@Module({
  imports: [
    // Registers the Grade model so GradesService can inject Model<GradeDocument>.
    MongooseModule.forFeature([{ name: Grade.name, schema: GradeSchema }]),

    // GradesService needs to verify that a student exists before assigning a grade.
    // Importing StudentsModule makes the exported StudentsService available here.
    StudentsModule,

    // GradesService also verifies that the homework exists before assigning a grade.
    // HomeworksModule exports HomeworksService, which is injected into GradesService.
    // This cross-module DI is how NestJS avoids circular dependencies between features.
    HomeworksModule,
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
