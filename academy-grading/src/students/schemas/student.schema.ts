import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student {
  @Prop({ require: true, trim: true })
  firstName!: string;

  @Prop({ require: true, trim: true })
  lastName!: string;

  @Prop({ require: true, trim: true, lowercase: true, unique: true })
  email!: string;

  @Prop({ trim: true })
  phoneNumber!: string; // +398(0)23123123
}

export const StudentSchema = SchemaFactory.createForClass(Student);
