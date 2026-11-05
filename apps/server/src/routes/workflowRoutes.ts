import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { asyncHandler, ApiError } from '../utils/api.js';
import { scopeFilter } from '../services/scope.js';
import { audit } from '../services/audit.js';
import { Reservation } from '../models/Reservation.js';
import { Room } from '../models/Room.js';
import { Folio } from '../models/Folio.js';
import { HousekeepingTask } from '../models/HousekeepingTask.js';
import { PurchaseRequisition } from '../models/PurchaseRequisition.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { PosOrder } from '../models/PosOrder.js';
import { Incident } from '../models/Incident.js';

export const reservationActions = Router();
reservationActions.post('/:id/check-in', authorize('reservations.checkin'), asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, ...scopeFilter(req) });
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  if (!['confirmed','pending'].includes(reservation.status)) throw new ApiError(409, `Cannot check in reservation with status ${reservation.status}`);
  const roomId = req.body.roomId || reservation.roomId;
  if (!roomId) throw new ApiError(400, 'A room must be assigned');
  const room = await Room.findOne({ _id: roomId, propertyId: reservation.propertyId });
  if (!room || !['vacant_clean','inspected','reserved'].includes(room.status)) throw new ApiError(409, 'Room is not available for check-in');
  const before = reservation.toObject();
  reservation.roomId = room._id; reservation.status = 'checked_in'; reservation.checkedInAt = new Date(); await reservation.save();
  room.status = 'occupied'; await room.save();
  const nights = Math.max(1, Math.ceil((reservation.checkOutDate.getTime()-reservation.checkInDate.getTime())/86400000));
  const roomAmount = nights * reservation.ratePerNight * (1-reservation.discountPercent/100);
  const tax = roomAmount * reservation.taxPercent/100;
  const existing = await Folio.findOne({ reservationId: reservation._id });
  if (!existing) await Folio.create({ propertyId: reservation.propertyId, folioNumber: `FOL-${Date.now()}`, reservationId: reservation._id, guestId: reservation.guestId, charges: [{ description: `${nights} night room charge`, department: 'rooms', amount: roomAmount, tax, postedAt: new Date(), voided: false }], payments: reservation.deposit > 0 ? [{ method: 'card', amount: reservation.deposit, reference: 'Reservation deposit', paidAt: new Date() }] : [] });
  await audit(req,'check_in','Reservation',String(reservation._id),before,reservation.toObject());
  res.json({ reservation, room });
}));
reservationActions.post('/:id/check-out', authorize('reservations.checkout'), asyncHandler(async (req, res) => {
  const reservation = await Reservation.findOne({ _id: req.params.id, ...scopeFilter(req) });
  if (!reservation) throw new ApiError(404, 'Reservation not found');
  if (reservation.status !== 'checked_in') throw new ApiError(409, 'Only checked-in reservations can be checked out');
  const folio = await Folio.findOne({ reservationId: reservation._id });
  if (folio && folio.balance > 0.01 && !req.body.force) throw new ApiError(409, `Outstanding folio balance: ${folio.balance.toFixed(2)}`);
  const before = reservation.toObject(); reservation.status='checked_out'; reservation.checkedOutAt=new Date(); await reservation.save();
  if (reservation.roomId) {
    const room=await Room.findById(reservation.roomId); if (room) { room.status='vacant_dirty'; await room.save();
      await HousekeepingTask.create({ propertyId: reservation.propertyId, roomId: room._id, type:'checkout_clean', priority:'high', status:'open', departmentId:'housekeeping', dueAt:new Date(Date.now()+2*60*60*1000) });
    }
  }
  await audit(req,'check_out','Reservation',String(reservation._id),before,reservation.toObject()); res.json({ reservation, folio });
}));
reservationActions.post('/:id/cancel', authorize('reservations.cancel'), asyncHandler(async (req,res)=>{
  const reservation=await Reservation.findOne({_id:req.params.id,...scopeFilter(req)}); if(!reservation) throw new ApiError(404,'Reservation not found');
  if(['checked_in','checked_out'].includes(reservation.status)) throw new ApiError(409,'Cannot cancel an in-house or completed stay');
  const before=reservation.toObject(); reservation.status='cancelled'; await reservation.save();
  if(reservation.roomId) await Room.updateOne({_id:reservation.roomId,status:'reserved'},{$set:{status:'vacant_clean'}});
  await audit(req,'cancel','Reservation',String(reservation._id),before,reservation.toObject(),req.body.reason); res.json(reservation);
}));

export const roomActions=Router();
roomActions.post('/:id/status',authorize('rooms.status'),asyncHandler(async(req,res)=>{
  const allowed=['vacant_clean','vacant_dirty','inspected','reserved','occupied','due_out','do_not_disturb','out_of_order','out_of_service','maintenance'];
  if(!allowed.includes(req.body.status)) throw new ApiError(400,'Invalid room status');
  const room=await Room.findOne({_id:req.params.id,...scopeFilter(req)}); if(!room) throw new ApiError(404,'Room not found');
  const before=room.toObject(); room.status=req.body.status; await room.save(); await audit(req,'status_change','Room',String(room._id),before,room.toObject(),req.body.reason); res.json(room);
}));

export const housekeepingActions=Router();
housekeepingActions.post('/:id/start',authorize('housekeeping.manage'),asyncHandler(async(req,res)=>{const task=await HousekeepingTask.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!task)throw new ApiError(404,'Task not found');task.status='in_progress';if(!task.assignedTo)task.assignedTo=req.auth!.user._id;await task.save();res.json(task);}));
housekeepingActions.post('/:id/complete',authorize('housekeeping.manage'),asyncHandler(async(req,res)=>{const task=await HousekeepingTask.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!task)throw new ApiError(404,'Task not found');const before=task.toObject();task.status='cleaned';task.completedAt=new Date();await task.save();await Room.updateOne({_id:task.roomId},{$set:{status:'vacant_clean'}});await audit(req,'complete','HousekeepingTask',String(task._id),before,task.toObject());res.json(task);}));
housekeepingActions.post('/:id/inspect',authorize('housekeeping.inspect'),asyncHandler(async(req,res)=>{const task=await HousekeepingTask.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!task)throw new ApiError(404,'Task not found');if(task.status!=='cleaned')throw new ApiError(409,'Task must be cleaned before inspection');task.status='inspected';task.inspectedBy=req.auth!.user._id;await task.save();await Room.updateOne({_id:task.roomId},{$set:{status:'inspected'}});await audit(req,'inspect','HousekeepingTask',String(task._id),undefined,task.toObject());res.json(task);}));

export const procurementActions=Router();
procurementActions.post('/:id/approve',authorize('procurement.approve'),asyncHandler(async(req,res)=>{const doc=await PurchaseRequisition.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!doc)throw new ApiError(404,'Requisition not found');if(doc.status!=='submitted')throw new ApiError(409,'Only submitted requisitions can be approved');const before=doc.toObject();doc.status=req.body.approved===false?'rejected':'approved';doc.approvedBy=req.auth!.user._id;doc.approvedAt=new Date();doc.approvalNote=req.body.note;await doc.save();await audit(req,doc.status,'PurchaseRequisition',String(doc._id),before,doc.toObject());res.json(doc);}));

export const maintenanceActions=Router();
maintenanceActions.post('/:id/status',authorize('maintenance.manage'),asyncHandler(async(req,res)=>{const allowed=['open','assigned','in_progress','waiting_parts','completed','closed','cancelled'];if(!allowed.includes(req.body.status))throw new ApiError(400,'Invalid status');const doc=await WorkOrder.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!doc)throw new ApiError(404,'Work order not found');const before=doc.toObject();doc.status=req.body.status;doc.resolution=req.body.resolution??doc.resolution;if(['completed','closed'].includes(doc.status))doc.completedAt=new Date();await doc.save();await audit(req,'status_change','WorkOrder',String(doc._id),before,doc.toObject());res.json(doc);}));

export const folioActions=Router();
folioActions.post('/:id/charge',authorize('folios.manage'),asyncHandler(async(req,res)=>{const doc=await Folio.findOne({_id:req.params.id,...scopeFilter(req)});if(!doc)throw new ApiError(404,'Folio not found');doc.charges.push({description:req.body.description,department:req.body.department??'misc',amount:Number(req.body.amount),tax:Number(req.body.tax??0),postedAt:new Date(),reference:req.body.reference,voided:false} as any);await doc.save();await audit(req,'post_charge','Folio',String(doc._id),undefined,req.body);res.json(doc);}));
folioActions.post('/:id/settle',authorize('folios.settle'),asyncHandler(async(req,res)=>{const doc=await Folio.findOne({_id:req.params.id,...scopeFilter(req)});if(!doc)throw new ApiError(404,'Folio not found');const amount=Number(req.body.amount??doc.balance);if(amount<=0)throw new ApiError(400,'Payment amount must be positive');doc.payments.push({method:req.body.method??'card',amount,reference:req.body.reference,paidAt:new Date()} as any);await doc.save();if(Math.abs(doc.balance)<0.01){doc.status='settled';doc.settledAt=new Date();await doc.save();}await audit(req,'settle','Folio',String(doc._id),undefined,{amount,method:req.body.method});res.json(doc);}));
folioActions.post('/:id/refund',authorize('folios.refund'),asyncHandler(async(req,res)=>{const doc=await Folio.findOne({_id:req.params.id,...scopeFilter(req)});if(!doc)throw new ApiError(404,'Folio not found');const amount=Number(req.body.amount);if(amount<=0||amount>doc.totalPayments)throw new ApiError(400,'Invalid refund amount');doc.payments.push({method:req.body.method??'card',amount:-amount,reference:`REFUND: ${req.body.reason??''}`,paidAt:new Date()} as any);doc.status='refunded';await doc.save();await audit(req,'refund','Folio',String(doc._id),undefined,{amount,reason:req.body.reason});res.json(doc);}));

export const posActions=Router();
posActions.post('/:id/post-to-room',authorize('pos.manage'),asyncHandler(async(req,res)=>{const order=await PosOrder.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!order)throw new ApiError(404,'Order not found');if(!order.reservationId)throw new ApiError(400,'Reservation is required for room charge');const folio=await Folio.findOne({reservationId:order.reservationId});if(!folio)throw new ApiError(404,'Open folio not found');if(folio.status!=='open')throw new ApiError(409,'Folio is not open');folio.charges.push({description:`${order.outlet} POS ${order.orderNumber}`,department:'food_beverage',amount:order.subtotal-order.discount,tax:order.tax,postedAt:new Date(),reference:order.orderNumber,voided:false} as any);await folio.save();order.paymentMode='room_charge';order.status='paid';await order.save();await audit(req,'post_to_room','PosOrder',String(order._id),undefined,{folioId:folio._id,total:order.total});res.json({order,folio});}));

export const incidentActions=Router();
incidentActions.post('/:id/resolve',authorize('security.manage'),asyncHandler(async(req,res)=>{const doc=await Incident.findOne({_id:req.params.id,...scopeFilter(req,{departmentField:'departmentId'})});if(!doc)throw new ApiError(404,'Incident not found');doc.status='resolved';doc.resolution=req.body.resolution;doc.resolvedAt=new Date();await doc.save();await audit(req,'resolve','Incident',String(doc._id),undefined,doc.toObject());res.json(doc);}));
