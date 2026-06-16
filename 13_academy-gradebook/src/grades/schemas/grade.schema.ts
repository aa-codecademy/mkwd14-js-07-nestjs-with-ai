import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import { Types } from 'mongoose';

export type GradeDocument = HydratedDocument<Grade>;

@Schema({ timestamps: true })
export class Grade {
  // type: Types.ObjectId tells Mongoose to store this as a MongoDB ObjectId (a 12-byte
  // binary reference) rather than a string. ref: 'Student' names the collection this
  // ObjectId points to — required for .populate('student') to work later. Without ref,
  // Mongoose doesn't know which model to load when you ask it to resolve the reference.
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Homework', required: true })
  homework!: Types.ObjectId;

  // min/max are Mongoose schema-level validators — they run before saving and throw
  // a ValidationError if the value is outside range. This is separate from class-validator
  // on the DTO, which runs at the HTTP layer before the service is ever called.
  @Prop({ required: true, min: 1, max: 10 })
  value!: number;

  @Prop({ trim: true })
  notes!: string;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);
