import { Module } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Class, ClassSchema } from './schemas/class.schema';

@Module({
  imports: [
    // MongooseModule.forFeature() registers the Class model scoped to this module.
    // name: Class.name resolves to the string 'Class', which Mongoose uses as the
    // collection name (pluralised to 'classes' automatically). This registration
    // makes the Model<ClassDocument> injectable via @InjectModel(Class.name) inside
    // any provider listed in this module's providers array.
    MongooseModule.forFeature([{ name: Class.name, schema: ClassSchema }]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
