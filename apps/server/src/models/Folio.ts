import mongoose, { type Types } from 'mongoose';
const { Schema } = mongoose;

export interface IFolioCharge { description: string; department: string; amount: number; tax: number; postedAt: Date; reference?: string; voided: boolean; }
export interface IFolioPayment { method: 'cash' | 'card' | 'bank_transfer' | 'wallet' | 'corporate'; amount: number; reference?: string; paidAt: Date; }
export interface IFolio {
  propertyId: Types.ObjectId;
  folioNumber: string;
  reservationId: Types.ObjectId;
  guestId: Types.ObjectId;
  status: 'open' | 'settled' | 'refunded' | 'closed';
  charges: IFolioCharge[];
  payments: IFolioPayment[];
  totalCharges: number;
  totalPayments: number;
  balance: number;
  settledAt?: Date;
}

const chargeSchema = new Schema<IFolioCharge>({
  description: { type: String, required: true },
  department: { type: String, required: true },
  amount: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  postedAt: { type: Date, default: Date.now },
  reference: String,
  voided: { type: Boolean, default: false }
}, { _id: true });
const paymentSchema = new Schema<IFolioPayment>({
  method: { type: String, enum: ['cash','card','bank_transfer','wallet','corporate'], required: true },
  amount: { type: Number, required: true },
  reference: String,
  paidAt: { type: Date, default: Date.now }
}, { _id: true });
const schema = new Schema<IFolio>({
  propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
  folioNumber: { type: String, required: true, unique: true },
  reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
  guestId: { type: Schema.Types.ObjectId, ref: 'Guest', required: true },
  status: { type: String, enum: ['open','settled','refunded','closed'], default: 'open' },
  charges: { type: [chargeSchema], default: [] },
  payments: { type: [paymentSchema], default: [] },
  totalCharges: { type: Number, default: 0 },
  totalPayments: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  settledAt: Date
}, { timestamps: true });

schema.pre('save', function () {
  this.totalCharges = this.charges.filter(c => !c.voided).reduce((s, c) => s + c.amount + c.tax, 0);
  this.totalPayments = this.payments.reduce((s, p) => s + p.amount, 0);
  this.balance = this.totalCharges - this.totalPayments;
});
export const Folio = mongoose.models.Folio || mongoose.model<IFolio>('Folio', schema);

