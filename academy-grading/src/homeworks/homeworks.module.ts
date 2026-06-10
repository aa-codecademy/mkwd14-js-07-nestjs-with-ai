import { Module } from '@nestjs/common';
import { HomeworksService } from './homeworks.service';
import { HomeworksController } from './homeworks.controller';

@Module({
  controllers: [HomeworksController],
  providers: [HomeworksService],
})
export class HomeworksModule {}
