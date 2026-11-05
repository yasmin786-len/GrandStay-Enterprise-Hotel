import { Router } from 'express';
import { createCrudRouter } from './crudFactory.js';
import { Property } from '../models/Property.js';
import { Guest } from '../models/Guest.js';
import { Room } from '../models/Room.js';
import { Reservation } from '../models/Reservation.js';
import { HousekeepingTask } from '../models/HousekeepingTask.js';
import { WorkOrder } from '../models/WorkOrder.js';
import { InventoryItem } from '../models/InventoryItem.js';
import { PurchaseRequisition } from '../models/PurchaseRequisition.js';
import { Employee } from '../models/Employee.js';
import { BanquetEvent } from '../models/BanquetEvent.js';
import { Incident } from '../models/Incident.js';
import { PosOrder } from '../models/PosOrder.js';
import { Folio } from '../models/Folio.js';
import { Room as RoomModel } from '../models/Room.js';
import { ApiError } from '../utils/api.js';
import * as s from './schemas.js';

const router = Router();
const code = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;

router.use('/properties', createCrudRouter({ name:'Property', model:Property, readPermission:'properties.read', managePermission:'properties.manage', scope:{propertyField:'_id'}, searchFields:['name','code'], createSchema:s.propertyCreate, updateSchema:s.propertyUpdate }));
router.use('/guests', createCrudRouter({ name:'Guest', model:Guest, readPermission:'guests.read', managePermission:'guests.manage', searchFields:['firstName','lastName','email','phone'], populate:['propertyId'], createSchema:s.guestCreate, updateSchema:s.guestUpdate }));
router.use('/rooms', createCrudRouter({ name:'Room', model:Room, readPermission:'rooms.read', managePermission:'rooms.manage', searchFields:['number','floor','type','status'], populate:['propertyId'], createSchema:s.roomCreate, updateSchema:s.roomUpdate }));
router.use('/reservations', createCrudRouter({
  name:'Reservation', model:Reservation, readPermission:'reservations.read', managePermission:'reservations.manage', searchFields:['confirmationNumber','roomType','source','status'], populate:['propertyId','guestId','roomId'], createSchema:s.reservationCreate, updateSchema:s.reservationUpdate,
  beforeCreate: async (req,body) => {
    body.confirmationNumber=code('RES'); body.createdBy=req.auth!.user._id;
    if(body.roomId==='') delete body.roomId;
    if(body.roomId){const room=await RoomModel.findOne({_id:body.roomId,propertyId:body.propertyId});if(!room||!['vacant_clean','inspected'].includes(room.status))throw new ApiError(409,'Selected room is unavailable');}
  },
  afterCreate: async (_req,doc) => { if(doc.roomId) await RoomModel.updateOne({_id:doc.roomId},{$set:{status:'reserved'}}); }
}));
router.use('/housekeeping', createCrudRouter({ name:'HousekeepingTask', model:HousekeepingTask, readPermission:'housekeeping.read', managePermission:'housekeeping.manage', scope:{departmentField:'departmentId'}, searchFields:['type','priority','status','notes'], populate:['propertyId','roomId','assignedTo'], createSchema:s.housekeepingCreate, updateSchema:s.housekeepingUpdate }));
router.use('/maintenance', createCrudRouter({ name:'WorkOrder', model:WorkOrder, readPermission:'maintenance.read', managePermission:'maintenance.manage', scope:{departmentField:'departmentId'}, searchFields:['title','description','asset','priority','status'], populate:['propertyId','roomId','assignedTo','requestedBy'], createSchema:s.workOrderCreate, updateSchema:s.workOrderUpdate, beforeCreate:(req,body)=>{body.requestedBy=req.auth!.user._id;if(body.assignedTo==='')delete body.assignedTo;if(body.roomId==='')delete body.roomId;} }));
router.use('/inventory', createCrudRouter({ name:'InventoryItem', model:InventoryItem, readPermission:'inventory.read', managePermission:'inventory.manage', scope:{departmentField:'departmentId'}, searchFields:['sku','name','category','departmentId'], populate:['propertyId'], createSchema:s.inventoryCreate, updateSchema:s.inventoryUpdate }));
router.use('/procurement', createCrudRouter({ name:'PurchaseRequisition', model:PurchaseRequisition, readPermission:'procurement.read', managePermission:'procurement.manage', scope:{departmentField:'departmentId'}, searchFields:['number','title','departmentId','status'], populate:['propertyId','requestedBy','approvedBy'], createSchema:s.purchaseCreate, updateSchema:s.purchaseUpdate, beforeCreate:(req,body)=>{body.number=code('PR');body.requestedBy=req.auth!.user._id;} }));
router.use('/employees', createCrudRouter({ name:'Employee', model:Employee, readPermission:'employees.read', managePermission:'employees.manage', scope:{departmentField:'departmentId'}, searchFields:['employeeCode','name','email','departmentId','designation'], populate:['propertyId'], createSchema:s.employeeCreate, updateSchema:s.employeeUpdate }));
router.use('/banquets', createCrudRouter({ name:'BanquetEvent', model:BanquetEvent, readPermission:'banquets.read', managePermission:'banquets.manage', searchFields:['eventNumber','clientName','eventType','venue','status'], populate:['propertyId','ownerId'], createSchema:s.banquetCreate, updateSchema:s.banquetUpdate, beforeCreate:(req,body)=>{body.eventNumber=code('EVT');body.ownerId=req.auth!.user._id;} }));
router.use('/incidents', createCrudRouter({ name:'Incident', model:Incident, readPermission:'security.read', managePermission:'security.manage', scope:{departmentField:'departmentId'}, searchFields:['number','category','severity','title','status'], populate:['propertyId','reportedBy','assignedTo'], createSchema:s.incidentCreate, updateSchema:s.incidentUpdate, beforeCreate:(req,body)=>{body.number=code('INC');body.reportedBy=req.auth!.user._id;if(body.assignedTo==='')delete body.assignedTo;} }));
router.use('/pos-orders', createCrudRouter({ name:'PosOrder', model:PosOrder, readPermission:'pos.read', managePermission:'pos.manage', scope:{departmentField:'departmentId'}, searchFields:['orderNumber','outlet','tableNumber','paymentMode','status'], populate:['propertyId','roomId','reservationId','createdBy'], createSchema:s.posCreate, updateSchema:s.posUpdate, beforeCreate:(req,body)=>{body.orderNumber=code('POS');body.createdBy=req.auth!.user._id;if(body.roomId==='')delete body.roomId;if(body.reservationId==='')delete body.reservationId;} }));
router.use('/folios', createCrudRouter({ name:'Folio', model:Folio, readPermission:'folios.read', managePermission:'folios.manage', searchFields:['folioNumber','status'], populate:['propertyId','reservationId','guestId'] }));

export default router;
