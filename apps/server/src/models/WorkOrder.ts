import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IWorkOrder {
  propertyId: Types.ObjectId;
  departmentId: string;
  title: string;
  description?: string;
  asset?: string;
  roomId?: Types.ObjectId;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  status: 'open' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'closed' | 'cancelled';
  assignedTo?: Types.ObjectId;
  requestedBy: Types.ObjectId;
  partsCost: number;
  labourCost: number;
  resolution?: string;
  completedAt?: Date;
}

const schema = new Schema<IWorkOrder>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, default: 'engineering', index: true },
  title: { type: String, required: true },
  description: String,
  asset: String,
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  priority: { type: String, enum: ['low','normal','high','emergency'], default: 'normal' },
  status: { type: String, enum: ['open','assigned','in_progress','waiting_parts','completed','closed','cancelled'], default: 'open' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  partsCost: { type: Number, default: 0 },
  labourCost: { type: Number, default: 0 },
  resolution: String,
  completedAt: Date
}, { timestamps: true });

export const WorkOrder = mongoose.models.WorkOrder || mongoose.model<IWorkOrder>('WorkOrder', schema);

