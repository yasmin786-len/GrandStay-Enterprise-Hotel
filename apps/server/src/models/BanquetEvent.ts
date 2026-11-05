import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IBanquetEvent {
  propertyId: Types.ObjectId;
  eventNumber: string;
  clientName: string;
  eventType: string;
  venue: string;
  startAt: Date;
  endAt: Date;
  guestCount: number;
  status: 'lead' | 'tentative' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  packageAmount: number;
  advancePaid: number;
  requirements?: string;
  ownerId: Types.ObjectId;
}

const schema = new Schema<IBanquetEvent>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  eventNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  eventType: { type: String, required: true },
  venue: { type: String, required: true },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  guestCount: { type: Number, default: 1 },
  status: { type: String, enum: ['lead','tentative','confirmed','in_progress','completed','cancelled'], default: 'lead' },
  packageAmount: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  requirements: String,
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
export const BanquetEvent = mongoose.models.BanquetEvent || mongoose.model<IBanquetEvent>('BanquetEvent', schema);

