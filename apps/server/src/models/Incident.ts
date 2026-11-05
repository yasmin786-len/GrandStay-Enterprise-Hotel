import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IIncident {
  propertyId: Types.ObjectId;
  departmentId: string;
  number: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  reportedBy: Types.ObjectId;
  assignedTo?: Types.ObjectId;
  resolution?: string;
  resolvedAt?: Date;
}

const schema = new Schema<IIncident>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, default: 'security', index: true },
  number: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  severity: { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: String,
  status: { type: String, enum: ['open','investigating','resolved','closed'], default: 'open' },
  reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  resolution: String,
  resolvedAt: Date
}, { timestamps: true });
export const Incident = mongoose.models.Incident || mongoose.model<IIncident>('Incident', schema);

