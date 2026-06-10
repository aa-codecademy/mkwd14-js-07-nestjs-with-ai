import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ClassName } from '../types/class';

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, enum: ClassName })
  name!: ClassName;

  @Prop({ trim: true })
  description!: string;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
