import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IInventoryItem {
  propertyId: Types.ObjectId;
  departmentId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderLevel: number;
  unitCost: number;
  expiryDate?: Date;
  active: boolean;
}

const schema = new Schema<IInventoryItem>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, required: true, index: true },
  sku: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 0 },
  unitCost: { type: Number, default: 0 },
  expiryDate: Date,
  active: { type: Boolean, default: true }
}, { timestamps: true });

schema.index({ propertyId: 1, sku: 1 }, { unique: true });
export const InventoryItem = mongoose.models.InventoryItem || mongoose.model<IInventoryItem>('InventoryItem', schema);

