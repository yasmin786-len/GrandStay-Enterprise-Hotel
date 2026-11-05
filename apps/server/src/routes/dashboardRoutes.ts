import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { asyncHandler } from '../utils/api.js';
import { scopeFilter } from '../services/scope.js';
import { Room } from '../models/Room.js';
import { Reservation } from '../models/Reservation.js';
import { Guest } from '../models/Guest.js';
import { HousekeepingTask } from '../models/HousekeepingTask.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { Folio } from '../models/Folio.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { BanquetEvent } from '../models/BanquetEvent.js';

const router=Router();
router.get('/',authorize('dashboard.read'),asyncHandler(async(req,res)=>{
  const base=scopeFilter(req); const department=scopeFilter(req,{departmentField:'departmentId'});
  const today=new Date(); today.setHours(0,0,0,0); const tomorrow=new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const [roomCount,occupied,dirty,arrivals,departures,inHouse,guests,openHousekeeping,openWorkOrders,folios,lowStock,events]=await Promise.all([
    Room.countDocuments(base),Room.countDocuments({...base,status:'occupied'}),Room.countDocuments({...base,status:'vacant_dirty'}),
    Reservation.countDocuments({...base,checkInDate:{$gte:today,$lt:tomorrow},status:{$in:['pending','confirmed']}}),
    Reservation.countDocuments({...base,checkOutDate:{$gte:today,$lt:tomorrow},status:'checked_in'}),
    Reservation.countDocuments({...base,status:'checked_in'}),Guest.countDocuments(base),
    HousekeepingTask.countDocuments({...department,status:{$in:['open','assigned','in_progress','cleaned']}}),
    WorkOrder.countDocuments({...department,status:{$in:['open','assigned','in_progress','waiting_parts']}}),
    Folio.find({...base,status:{$in:['open','settled']}}).select('totalCharges totalPayments balance').lean(),
    InventoryItem.countDocuments({...department,$expr:{$lte:['$quantity','$reorderLevel']}}),
    BanquetEvent.countDocuments({...base,startAt:{$gte:today},status:{$in:['tentative','confirmed','in_progress']}})
  ]);
  const revenue=folios.reduce((sum,f)=>sum+(f.totalCharges||0),0); const outstanding=folios.reduce((sum,f)=>sum+Math.max(0,f.balance||0),0);
  res.json({kpis:{roomCount,occupied,occupancyRate:roomCount?Math.round(occupied/roomCount*1000)/10:0,dirty,arrivals,departures,inHouse,guests,openHousekeeping,openWorkOrders,lowStock,events,revenue,outstanding},roomStatus:await Room.aggregate([{$match:base},{$group:{_id:'$status',value:{$sum:1}}},{$sort:{value:-1}}]),recentReservations:await Reservation.find(base).populate('guestId roomId').sort({createdAt:-1}).limit(6).lean()});
}));
export default router;
