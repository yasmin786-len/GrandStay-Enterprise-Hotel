import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IAuditLog {
  propertyId?: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
  reason?: string;
}
const schema = new Schema<IAuditLog>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: String,
  before: Schema.Types.Mixed,
  after: Schema.Types.Mixed,
  ip: String,
  userAgent: String,
  reason: String
}, { timestamps: true, versionKey: false });
export const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', schema);

