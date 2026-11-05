import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IEmployee {
  propertyId: Types.ObjectId;
  employeeCode: string;
  name: string;
  email?: string;
  phone?: string;
  departmentId: string;
  designation: string;
  joiningDate: Date;
  shift?: string;
  monthlySalary: number;
  active: boolean;
}

const schema = new Schema<IEmployee>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  employeeCode: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, lowercase: true },
  phone: String,
  departmentId: { type: String, required: true, index: true },
  designation: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  shift: String,
  monthlySalary: { type: Number, default: 0, select: false },
  active: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ propertyId: 1, employeeCode: 1 }, { unique: true });
export const Employee = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', schema);

