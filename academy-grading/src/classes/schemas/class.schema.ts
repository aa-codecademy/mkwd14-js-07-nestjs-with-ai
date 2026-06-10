import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ClassName } from '../types/class';
import type { HydratedDocument } from 'mongoose';

export type ClassDocument = HydratedDocument<Class>;

@Schema({ timestamps: true })
export class Class {
  @Prop({ required: true, enum: ClassName })
  name!: ClassName;

  @Prop({ trim: true })
  description!: string;
}

export const ClassSchema = SchemaFactory.createForClass(Class);
