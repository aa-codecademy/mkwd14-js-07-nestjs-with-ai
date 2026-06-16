import { Module } from '@nestjs/common';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';
import { Homework, HomeworkSchema } from './schemas/homework.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [
    // Registers the Homework Mongoose model so HomeworksService can inject it
    // with @InjectModel(Homework.name).
    MongooseModule.forFeature([
      { name: Homework.name, schema: HomeworkSchema },
    ]),
    // Importing ClassesModule makes ClassesService available inside HomeworksService.
    // This is cross-module dependency injection: HomeworksService calls
    // ClassesService.findOne() to verify a class exists before creating a homework.
    // ClassesModule must export ClassesService for this to work — see classes.module.ts.
    ClassesModule,
  ],
  controllers: [HomeworksController],
  providers: [HomeworksService],
  // Exporting HomeworksService allows GradesModule to import it and inject it
  // into GradesService for homework existence checks.
  exports: [HomeworksService],
})
export class HomeworksModule {}
