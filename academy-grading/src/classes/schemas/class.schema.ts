import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ClassName } from '../types/class';
import type { HydratedDocument } from 'mongoose';

// HydratedDocument<T> is the Mongoose type for a document that has been fetched
// from the database. It extends T with all Mongoose document methods (_id, save(),
// toObject(), etc.). Using it as the return type from service methods gives you
// full IntelliSense on both your own fields and Mongoose internals.
export type ClassDocument = HydratedDocument<Class>;

// @Schema() marks this plain TypeScript class as a Mongoose schema definition.
// timestamps: true tells Mongoose to automatically add createdAt and updatedAt
// fields to every document — no manual Date fields needed.
@Schema({ timestamps: true })
export class Class {
  // @Prop() maps this class property to a MongoDB document field.
  // required: true — Mongoose will reject saves where this field is absent.
  // enum: ClassName — restricts the stored value to the allowed ClassName values;
  //   Mongoose validates this at the ODM layer before hitting the database.
  @Prop({ required: true, enum: ClassName })
  name!: ClassName;

  // trim: true — Mongoose automatically strips leading/trailing whitespace before
  // saving, so you don't need to sanitise this in service code.
  @Prop({ trim: true })
  description!: string;
}

// SchemaFactory.createForClass() inspects the @Prop() decorators on the class
// and compiles them into a real Mongoose Schema object that can be registered
// with MongooseModule.forFeature() in the feature module.
export const ClassSchema = SchemaFactory.createForClass(Class);
