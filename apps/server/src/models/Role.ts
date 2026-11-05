import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;
import type { Permission, Scope } from '../constants/permissions.js';

export interface IRole {
  name: string;
  code: string;
  level: 1 | 2 | 3;
  scope: Scope;
  permissions: Permission[];
  description?: string;
  isSystem: boolean;
  createdBy?: Types.ObjectId;
}

const schema = new Schema<IRole>({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  level: { type: Number, enum: [1, 2, 3], required: true },
  scope: { type: String, enum: ['corporate', 'property', 'department', 'self'], required: true },
  permissions: [{ type: String, required: true }],
  description: String,
  isSystem: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const Role = mongoose.models.Role || mongoose.model<IRole>('Role', schema);

