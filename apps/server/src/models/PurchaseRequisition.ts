import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IPurchaseLine { itemName: string; quantity: number; unit: string; estimatedUnitCost: number; }
export interface IPurchaseRequisition {
  propertyId: Types.ObjectId;
  departmentId: string;
  number: string;
  title: string;
  lines: IPurchaseLine[];
  totalEstimatedCost: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'ordered' | 'received' | 'cancelled';
  requestedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvalNote?: string;
  approvedAt?: Date;
}

const lineSchema = new Schema<IPurchaseLine>({
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, required: true },
  estimatedUnitCost: { type: Number, required: true, min: 0 }
}, { _id: false });

const schema = new Schema<IPurchaseRequisition>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, required: true, index: true },
  number: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  lines: { type: [lineSchema], default: [] },
  totalEstimatedCost: { type: Number, default: 0 },
  status: { type: String, enum: ['draft','submitted','approved','rejected','ordered','received','cancelled'], default: 'submitted' },
  requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  approvalNote: String,
  approvedAt: Date
}, { timestamps: true });

schema.pre('save', function () {
  this.totalEstimatedCost = this.lines.reduce((sum, line) => sum + line.quantity * line.estimatedUnitCost, 0);
});
export const PurchaseRequisition = mongoose.models.PurchaseRequisition || mongoose.model<IPurchaseRequisition>('PurchaseRequisition', schema);

