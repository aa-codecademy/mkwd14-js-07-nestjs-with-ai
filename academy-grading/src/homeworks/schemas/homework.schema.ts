import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Homework {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description!: string;

  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  class!: Types.ObjectId;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
