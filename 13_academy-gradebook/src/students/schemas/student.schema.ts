import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

// HydratedDocument<Student> is the full Mongoose document type: your fields +
// _id, __v, save(), toObject(), and all other Mongoose document methods.
export type StudentDocument = HydratedDocument<Student>;

// @Schema({ timestamps: true }) adds createdAt / updatedAt managed by Mongoose.
@Schema({ timestamps: true })
export class Student {
  @Prop({ require: true, trim: true })
  firstName!: string;

  @Prop({ require: true, trim: true })
  lastName!: string;

  // lowercase: true — Mongoose converts the value to lowercase before saving,
  // keeping email comparisons case-insensitive without application-level logic.
  // unique: true — creates a unique MongoDB index on this field so duplicate
  // emails are rejected at the database level (not just in service code).
  @Prop({ require: true, trim: true, lowercase: true, unique: true })
  email!: string;

  @Prop({ trim: true })
  phoneNumber!: string; // +398(0)23123123
}

export const StudentSchema = SchemaFactory.createForClass(Student);
