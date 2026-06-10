import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Grade {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Homework', required: true })
  homework!: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 10 })
  value!: number;

  @Prop({ trim: true })
  notes!: string;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);
