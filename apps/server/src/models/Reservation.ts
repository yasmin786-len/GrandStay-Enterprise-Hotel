import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IReservation {
  propertyId: Types.ObjectId;
  confirmationNumber: string;
  guestId: Types.ObjectId;
  roomId?: Types.ObjectId;
  roomType: string;
  checkInDate: Date;
  checkOutDate: Date;
  adults: number;
  children: number;
  source: 'direct' | 'walk_in' | 'ota' | 'travel_agent' | 'corporate' | 'group';
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  ratePerNight: number;
  discountPercent: number;
  taxPercent: number;
  deposit: number;
  specialRequests?: string;
  checkedInAt?: Date;
  checkedOutAt?: Date;
  createdBy: Types.ObjectId;
}

const schema = new Schema<IReservation>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  confirmationNumber: { type: String, required: true, unique: true, index: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  roomType: { type: String, required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  adults: { type: Number, default: 1 },
  children: { type: Number, default: 0 },
  source: { type: String, enum: ['direct','walk_in','ota','travel_agent','corporate','group'], default: 'direct' },
  status: { type: String, enum: ['pending','confirmed','checked_in','checked_out','cancelled','no_show'], default: 'confirmed' },
  ratePerNight: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  taxPercent: { type: Number, default: 12, min: 0 },
  deposit: { type: Number, default: 0, min: 0 },
  specialRequests: String,
  checkedInAt: Date,
  checkedOutAt: Date,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Reservation = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', schema);

