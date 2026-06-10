import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Homework {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description!: string;

  // References the Class collection via an ObjectId. Storing only the _id keeps
  // the document small; call .populate('class') in a query to join the full Class
  // document when needed without duplicating data across collections.
  @Prop({ type: Types.ObjectId, ref: 'Class', required: true })
  class!: Types.ObjectId;
}

export const HomeworkSchema = SchemaFactory.createForClass(Homework);
