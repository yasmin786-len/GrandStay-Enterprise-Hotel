import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IPosOrderItem { name: string; quantity: number; unitPrice: number; taxPercent: number; }
export interface IPosOrder {
  propertyId: Types.ObjectId;
  departmentId: string;
  orderNumber: string;
  outlet: string;
  tableNumber?: string;
  roomId?: Types.ObjectId;
  reservationId?: Types.ObjectId;
  items: IPosOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMode: 'cash' | 'card' | 'room_charge' | 'corporate';
  status: 'open' | 'sent_to_kitchen' | 'served' | 'paid' | 'voided';
  createdBy: Types.ObjectId;
}

const itemSchema = new Schema<IPosOrderItem>({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  taxPercent: { type: Number, default: 5 }
}, { _id: false });
const schema = new Schema<IPosOrder>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  departmentId: { type: String, default: 'food_beverage', index: true },
  orderNumber: { type: String, required: true, unique: true },
  outlet: { type: String, required: true },
  tableNumber: String,
  roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
  reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation' },
  items: { type: [itemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['cash','card','room_charge','corporate'], default: 'cash' },
  status: { type: String, enum: ['open','sent_to_kitchen','served','paid','voided'], default: 'open' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
schema.pre('save', function () {
  this.subtotal = this.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  this.tax = this.items.reduce((s, i) => s + i.quantity * i.unitPrice * i.taxPercent / 100, 0);
  this.total = Math.max(0, this.subtotal + this.tax - this.discount);
});
export const PosOrder = mongoose.models.PosOrder || mongoose.model<IPosOrder>('PosOrder', schema);

