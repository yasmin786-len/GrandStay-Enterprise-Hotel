import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IGuest {
  propertyId: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  vip: boolean;
  loyaltyTier: 'member' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  preferences?: string[];
  notes?: string;
}

const schema = new Schema<IGuest>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: String,
  nationality: String,
  idType: String,
  idNumber: String,
  vip: { type: Boolean, default: false },
  loyaltyTier: { type: String, enum: ['member', 'silver', 'gold', 'platinum'], default: 'member' },
  loyaltyPoints: { type: Number, default: 0 },
  preferences: [String],
  notes: String
}, { timestamps: true });

schema.index({ propertyId: 1, email: 1 });
export const Guest = mongoose.models.Guest || mongoose.model<IGuest>('Guest', schema);

