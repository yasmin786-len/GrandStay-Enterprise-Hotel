import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IHousekeepingTask {
  propertyId: Types.ObjectId;
  departmentId: string;
  roomId: Types.ObjectId;
  type: 'checkout_clean' | 'stayover' | 'deep_clean' | 'turndown' | 'inspection' | 'minibar';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'cleaned' | 'inspected' | 'cancelled';
  assignedTo?: Types.ObjectId;
  dueAt?: Date;
  notes?: string;
  completedAt?: Date;
  inspectedBy?: Types.ObjectId;
}

const schema = new Schema<IHousekeepingTask>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, default: 'housekeeping', index: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  type: { type: String, enum: ['checkout_clean','stayover','deep_clean','turndown','inspection','minibar'], required: true },
  priority: { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  status: { type: String, enum: ['open','assigned','in_progress','cleaned','inspected','cancelled'], default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  dueAt: Date,
  notes: String,
  completedAt: Date,
  inspectedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export const HousekeepingTask = mongoose.models.HousekeepingTask || mongoose.model<IHousekeepingTask>('HousekeepingTask', schema);

