import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId');
const optionalObjectId = objectId.optional().or(z.literal(''));
const nonNegative = z.coerce.number().min(0);

export const propertyCreate = z.object({
  name: z.string().min(2), code: z.string().min(2), type: z.enum(['hotel','resort','serviced_apartment']).default('hotel'),
  timezone: z.string().default('Asia/Kolkata'), currency: z.string().length(3).default('GBP'), address: z.string().optional(), phone: z.string().optional(), email: z.string().email().optional(), active: z.boolean().default(true)
});
export const propertyUpdate = propertyCreate.partial();

export const guestCreate = z.object({
  propertyId: objectId, firstName: z.string().min(1), lastName: z.string().min(1), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional(), nationality: z.string().optional(), idType: z.string().optional(), idNumber: z.string().optional(), vip: z.boolean().default(false), loyaltyTier: z.enum(['member','silver','gold','platinum']).default('member'), loyaltyPoints: nonNegative.default(0), preferences: z.array(z.string()).default([]), notes: z.string().optional()
});
export const guestUpdate = guestCreate.partial();

export const roomCreate = z.object({
  propertyId: objectId, number: z.string().min(1), floor: z.string().min(1), type: z.string().min(1), capacity: z.coerce.number().int().min(1).default(2), baseRate: nonNegative, status: z.enum(['vacant_clean','vacant_dirty','inspected','reserved','occupied','due_out','do_not_disturb','out_of_order','out_of_service','maintenance']).default('vacant_clean'), amenities: z.array(z.string()).default([]), active: z.boolean().default(true)
});
export const roomUpdate = roomCreate.partial();

export const reservationCreate = z.object({
  propertyId: objectId, guestId: objectId, roomId: optionalObjectId, roomType: z.string().min(1), checkInDate: z.coerce.date(), checkOutDate: z.coerce.date(), adults: z.coerce.number().int().min(1).default(1), children: z.coerce.number().int().min(0).default(0), source: z.enum(['direct','walk_in','ota','travel_agent','corporate','group']).default('direct'), status: z.enum(['pending','confirmed']).default('confirmed'), ratePerNight: nonNegative, discountPercent: z.coerce.number().min(0).max(100).default(0), taxPercent: nonNegative.default(12), deposit: nonNegative.default(0), specialRequests: z.string().optional()
}).refine(data => data.checkOutDate > data.checkInDate, { message: 'Check-out must be after check-in', path: ['checkOutDate'] });
export const reservationUpdate = z.object({ roomId: optionalObjectId, roomType: z.string().optional(), checkInDate: z.coerce.date().optional(), checkOutDate: z.coerce.date().optional(), adults: z.coerce.number().int().min(1).optional(), children: z.coerce.number().int().min(0).optional(), source: z.enum(['direct','walk_in','ota','travel_agent','corporate','group']).optional(), ratePerNight: nonNegative.optional(), discountPercent: z.coerce.number().min(0).max(100).optional(), taxPercent: nonNegative.optional(), deposit: nonNegative.optional(), specialRequests: z.string().optional() });

export const housekeepingCreate = z.object({ propertyId: objectId, departmentId: z.string().default('housekeeping'), roomId: objectId, type: z.enum(['checkout_clean','stayover','deep_clean','turndown','inspection','minibar']), priority: z.enum(['low','normal','high','urgent']).default('normal'), status: z.enum(['open','assigned','in_progress']).default('open'), assignedTo: optionalObjectId, dueAt: z.coerce.date().optional(), notes: z.string().optional() });
export const housekeepingUpdate = housekeepingCreate.partial();

export const workOrderCreate = z.object({ propertyId: objectId, departmentId: z.string().default('engineering'), title: z.string().min(2), description: z.string().optional(), asset: z.string().optional(), roomId: optionalObjectId, priority: z.enum(['low','normal','high','emergency']).default('normal'), status: z.enum(['open','assigned','in_progress','waiting_parts']).default('open'), assignedTo: optionalObjectId, partsCost: nonNegative.default(0), labourCost: nonNegative.default(0), resolution: z.string().optional() });
export const workOrderUpdate = workOrderCreate.partial();

export const inventoryCreate = z.object({ propertyId: objectId, departmentId: z.string().min(1), sku: z.string().min(1), name: z.string().min(2), category: z.string().min(1), unit: z.string().min(1), quantity: z.coerce.number().default(0), reorderLevel: nonNegative.default(0), unitCost: nonNegative.default(0), expiryDate: z.coerce.date().optional(), active: z.boolean().default(true) });
export const inventoryUpdate = inventoryCreate.partial();

const purchaseLine = z.object({ itemName: z.string().min(1), quantity: z.coerce.number().min(1), unit: z.string().min(1), estimatedUnitCost: nonNegative });
export const purchaseCreate = z.object({ propertyId: objectId, departmentId: z.string().min(1), title: z.string().min(2), lines: z.array(purchaseLine).min(1), status: z.enum(['draft','submitted']).default('submitted') });
export const purchaseUpdate = z.object({ title: z.string().min(2).optional(), lines: z.array(purchaseLine).min(1).optional(), status: z.enum(['draft','submitted','cancelled']).optional() });

export const employeeCreate = z.object({ propertyId: objectId, employeeCode: z.string().min(2), name: z.string().min(2), email: z.string().email().optional().or(z.literal('')), phone: z.string().optional(), departmentId: z.string().min(1), designation: z.string().min(1), joiningDate: z.coerce.date(), shift: z.string().optional(), monthlySalary: nonNegative.default(0), active: z.boolean().default(true) });
export const employeeUpdate = employeeCreate.partial();

export const banquetCreate = z.object({ propertyId: objectId, clientName: z.string().min(2), eventType: z.string().min(2), venue: z.string().min(1), startAt: z.coerce.date(), endAt: z.coerce.date(), guestCount: z.coerce.number().int().min(1), status: z.enum(['lead','tentative','confirmed','in_progress','completed','cancelled']).default('lead'), packageAmount: nonNegative.default(0), advancePaid: nonNegative.default(0), requirements: z.string().optional() });
export const banquetUpdate = banquetCreate.partial();

export const incidentCreate = z.object({ propertyId: objectId, departmentId: z.string().default('security'), category: z.string().min(1), severity: z.enum(['low','medium','high','critical']).default('medium'), title: z.string().min(2), description: z.string().min(2), location: z.string().optional(), status: z.enum(['open','investigating']).default('open'), assignedTo: optionalObjectId, resolution: z.string().optional() });
export const incidentUpdate = incidentCreate.partial();

const posItem = z.object({ name: z.string().min(1), quantity: z.coerce.number().min(1), unitPrice: nonNegative, taxPercent: nonNegative.default(5) });
export const posCreate = z.object({ propertyId: objectId, departmentId: z.string().default('food_beverage'), outlet: z.string().min(1), tableNumber: z.string().optional(), roomId: optionalObjectId, reservationId: optionalObjectId, items: z.array(posItem).min(1), discount: nonNegative.default(0), paymentMode: z.enum(['cash','card','room_charge','corporate']).default('cash'), status: z.enum(['open','sent_to_kitchen','served','paid']).default('open') });
export const posUpdate = z.object({ outlet: z.string().optional(), tableNumber: z.string().optional(), items: z.array(posItem).min(1).optional(), discount: nonNegative.optional(), paymentMode: z.enum(['cash','card','room_charge','corporate']).optional(), status: z.enum(['open','sent_to_kitchen','served','paid','voided']).optional() });
