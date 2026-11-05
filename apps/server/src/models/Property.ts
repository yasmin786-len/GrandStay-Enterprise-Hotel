import mongoose from 'mongoose';
const { Schema } = mongoose;

export interface IProperty {
  name: string;
  code: string;
  type: 'hotel' | 'resort' | 'serviced_apartment';
  timezone: string;
  currency: string;
  address?: string;
  phone?: string;
  email?: string;
  active: boolean;
}

const schema = new Schema<IProperty>({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['hotel', 'resort', 'serviced_apartment'], default: 'hotel' },
  timezone: { type: String, default: 'Asia/Kolkata' },
  currency: { type: String, default: 'GBP' },
  address: String,
  phone: String,
  email: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const Property = mongoose.models.Property || mongoose.model<IProperty>('Property', schema);

