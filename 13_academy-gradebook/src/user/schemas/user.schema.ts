import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = HydratedDocument<User> & {
  comparePassword(candidatePassword: string): Promise<boolean>;
};

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username!: string;

  @Prop({ required: true, select: false })
  password!: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next: any) {
  if (!this.isModified('password')) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  next();
});

UserSchema.methods.comparePassword = function (candidatePassword: string) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
  return bcrypt.compare(candidatePassword, this.password);
};
