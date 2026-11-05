import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export type RoomStatus = 'vacant_clean' | 'vacant_dirty' | 'inspected' | 'reserved' | 'occupied' | 'due_out' | 'do_not_disturb' | 'out_of_order' | 'out_of_service' | 'maintenance';
export interface IRoom {
  propertyId: Types.ObjectId;
  number: string;
  floor: string;
  type: string;
  capacity: number;
  baseRate: number;
  status: RoomStatus;
  amenities: string[];
  active: boolean;
}

const schema = new Schema<IRoom>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  number: { type: String, required: true, trim: true },
  floor: { type: String, required: true },
  type: { type: String, required: true },
  capacity: { type: Number, default: 2, min: 1 },
  baseRate: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['vacant_clean','vacant_dirty','inspected','reserved','occupied','due_out','do_not_disturb','out_of_order','out_of_service','maintenance'], default: 'vacant_clean' },
  amenities: [String],
  active: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ propertyId: 1, number: 1 }, { unique: true });
export const Room = mongoose.models.Room || mongoose.model<IRoom>('Room', schema);

