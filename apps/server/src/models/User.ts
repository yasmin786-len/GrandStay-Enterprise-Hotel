import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;
import bcrypt from 'bcryptjs';

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  roleId: Types.ObjectId;
  propertyIds: Types.ObjectId[];
  departmentIds: string[];
  employeeId?: Types.ObjectId;
  active: boolean;
  lastLoginAt?: Date;
  comparePassword(password: string): Promise<boolean>;
}

const schema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  propertyIds: [{ type: Schema.Types.ObjectId, ref: 'Property' }],
  departmentIds: [{ type: String }],
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  active: { type: Boolean, default: true },
  lastLoginAt: Date
}, { timestamps: true });

schema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', schema);

