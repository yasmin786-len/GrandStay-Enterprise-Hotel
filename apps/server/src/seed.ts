import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDatabase } from './config/db.js';
import { PERMISSIONS, type Permission, type Scope } from './constants/permissions.js';
import { Role } from './models/Role.js';
import { Property } from './models/Property.js';
import { User } from './models/User.js';
import { Guest } from './models/Guest.js';
import { Room } from './models/Room.js';
import { Reservation } from './models/Reservation.js';
import { HousekeepingTask } from './models/HousekeepingTask.js';
import { WorkOrder } from './models/WorkOrder.js';
import { InventoryItem } from './models/InventoryItem.js';
import { PurchaseRequisition } from './models/PurchaseRequisition.js';
import { Employee } from './models/Employee.js';
import { BanquetEvent } from './models/BanquetEvent.js';
import { Incident } from './models/Incident.js';
import { PosOrder } from './models/PosOrder.js';
import { Folio } from './models/Folio.js';
import { AuditLog } from './models/AuditLog.js';

const p = (...prefixes: string[]) => PERMISSIONS.filter(permission => prefixes.some(prefix => permission === prefix || permission.startsWith(`${prefix}.`))) as Permission[];
const combine = (...sets: Permission[][]) => [...new Set(sets.flat())] as Permission[];

interface RoleSeed { name:string; code:string; level:1|2|3; scope:Scope; permissions:Permission[]; department?:string; description:string; }
const roles: RoleSeed[] = [
  {name:'Corporate Administrator',code:'corporate_admin',level:1,scope:'corporate',permissions:[...PERMISSIONS],description:'Full group-wide ERP administration.'},
  {name:'Group Owner',code:'group_owner',level:1,scope:'corporate',permissions:combine(p('dashboard','properties','guests','rooms','reservations','folios','inventory','procurement','maintenance','employees','banquets','security','reports','audit')),description:'Executive visibility across all properties.'},
  {name:'Corporate Finance Director',code:'corporate_finance',level:1,scope:'corporate',permissions:combine(p('dashboard','properties.read','folios','procurement','inventory.read','employees.payroll','reports','audit')),description:'Consolidated finance and controls.'},
  {name:'Regional Manager',code:'regional_manager',level:1,scope:'property',permissions:combine(p('dashboard','properties.read','users.read','guests','rooms','reservations','housekeeping','pos.read','folios','inventory','procurement','maintenance','employees.read','banquets','security.read','reports','audit')),description:'Oversight of assigned properties.'},
  {name:'General Manager',code:'general_manager',level:2,scope:'property',permissions:combine(p('dashboard','properties.read','users.read','users.manage','roles.read','guests','rooms','reservations','housekeeping','pos','folios','inventory','procurement','maintenance','employees','banquets','security','reports','audit')),description:'Complete operational control of one property.'},
  {name:'Front Office Manager',code:'front_office_manager',level:2,scope:'property',permissions:combine(p('dashboard','guests','rooms.read','rooms.status','reservations','folios.read','folios.manage','folios.settle','reports.read')),department:'front_office',description:'Reservations, reception and guest folios.'},
  {name:'Housekeeping Manager',code:'housekeeping_manager',level:2,scope:'department',permissions:combine(p('dashboard','rooms.read','rooms.status','housekeeping','inventory.read','maintenance.read','maintenance.manage','reports.read')),department:'housekeeping',description:'Housekeeping assignments and room inspection.'},
  {name:'Food & Beverage Manager',code:'fnb_manager',level:2,scope:'department',permissions:combine(p('dashboard','pos','folios.read','inventory','procurement.read','procurement.manage','reports.read')),department:'food_beverage',description:'Restaurant, room service and outlet control.'},
  {name:'Finance Manager',code:'finance_manager',level:2,scope:'property',permissions:combine(p('dashboard','folios','inventory.read','procurement','employees.payroll','reports','audit')),department:'finance',description:'Property finance, settlement and approvals.'},
  {name:'Purchase Manager',code:'purchase_manager',level:2,scope:'property',permissions:combine(p('dashboard','inventory','procurement','reports.read','audit.read')),department:'procurement',description:'Purchasing and supplier workflow.'},
  {name:'Engineering Manager',code:'engineering_manager',level:2,scope:'department',permissions:combine(p('dashboard','rooms.read','rooms.status','maintenance','inventory.read','procurement.read','procurement.manage','reports.read')),department:'engineering',description:'Assets and engineering operations.'},
  {name:'HR Manager',code:'hr_manager',level:2,scope:'property',permissions:combine(p('dashboard','users.read','employees','reports.read','audit.read')),department:'hr',description:'Employee administration and payroll access.'},
  {name:'Sales & Banquet Manager',code:'sales_manager',level:2,scope:'property',permissions:combine(p('dashboard','guests.read','reservations.read','banquets','folios.read','reports.read')),department:'sales',description:'Sales leads, groups and banquet events.'},
  {name:'Security Manager',code:'security_manager',level:2,scope:'department',permissions:combine(p('dashboard','guests.read','rooms.read','security','reports.read','audit.read')),department:'security',description:'Security incidents and investigations.'},
  {name:'Receptionist',code:'receptionist',level:3,scope:'property',permissions:combine(p('dashboard','guests','rooms.read','reservations.read','reservations.manage','reservations.checkin','reservations.checkout','reservations.cancel','folios.read','folios.manage','folios.settle')),department:'front_office',description:'Day-to-day reservation and front desk operations.'},
  {name:'Night Auditor',code:'night_auditor',level:3,scope:'property',permissions:combine(p('dashboard','guests.read','rooms.read','reservations.read','reservations.checkout','folios','reports.read','audit.read')),department:'front_office',description:'Night closure and revenue reconciliation.'},
  {name:'Room Attendant',code:'room_attendant',level:3,scope:'department',permissions:combine(p('dashboard','rooms.read','housekeeping.read','housekeeping.manage','maintenance.read','maintenance.manage')),department:'housekeeping',description:'Assigned room cleaning and issue reporting.'},
  {name:'Waiter / POS Operator',code:'waiter',level:3,scope:'department',permissions:combine(p('dashboard','pos.read','pos.manage','folios.read')),department:'food_beverage',description:'Outlet POS and room charge posting.'},
  {name:'Storekeeper',code:'storekeeper',level:3,scope:'department',permissions:combine(p('dashboard','inventory.read','inventory.manage','inventory.adjust','procurement.read','procurement.manage')),department:'stores',description:'Store stock and material transactions.'},
  {name:'Maintenance Technician',code:'technician',level:3,scope:'department',permissions:combine(p('dashboard','rooms.read','maintenance.read','maintenance.manage','maintenance.close','inventory.read')),department:'engineering',description:'Assigned maintenance work orders.'}
];

async function seed() {
  await connectDatabase();
  await mongoose.connection.dropDatabase();
  const [dehradun, mussoorie] = await Property.create([
    {name:'GrandStay Dehradun',code:'GSDDN',type:'hotel',timezone:'Asia/Kolkata',currency:'GBP',address:'Rajpur Road, Dehradun',email:'dehradun@grandstay.test'},
    {name:'GrandStay Mussoorie Resort',code:'GSMSR',type:'resort',timezone:'Asia/Kolkata',currency:'GBP',address:'Library Road, Mussoorie',email:'mussoorie@grandstay.test'}
  ]);

  const roleDocs = await Role.insertMany(roles.map(({department,...role}) => ({...role,isSystem:true})));
  const roleByCode = Object.fromEntries(roleDocs.map(role => [role.code, role]));
  const passwordHash = await bcrypt.hash('Hotel@123', 12);
  const users = [];
  for (const role of roles) {
    const propertyIds = role.scope === 'corporate' ? [dehradun._id,mussoorie._id] : [dehradun._id];
    users.push(await User.create({
      name: role.name,
      email: `${role.code}@grandstay.test`,
      passwordHash,
      roleId: roleByCode[role.code]._id,
      propertyIds,
      departmentIds: role.department ? [role.department] : [],
      active:true
    }));
  }
  const byRole = Object.fromEntries(users.map((user,index)=>[roles[index].code,user]));

  const rooms = await Room.insertMany([
    {propertyId:dehradun._id,number:'101',floor:'1',type:'Deluxe King',capacity:2,baseRate:135,status:'occupied',amenities:['Wi-Fi','King Bed','City View']},
    {propertyId:dehradun._id,number:'102',floor:'1',type:'Deluxe Twin',capacity:2,baseRate:125,status:'vacant_clean',amenities:['Wi-Fi','Twin Beds']},
    {propertyId:dehradun._id,number:'103',floor:'1',type:'Executive',capacity:3,baseRate:180,status:'vacant_dirty',amenities:['Wi-Fi','Work Desk','Lounge Access']},
    {propertyId:dehradun._id,number:'201',floor:'2',type:'Suite',capacity:4,baseRate:280,status:'inspected',amenities:['Living Room','Bathtub','Mountain View']},
    {propertyId:dehradun._id,number:'202',floor:'2',type:'Executive',capacity:3,baseRate:185,status:'maintenance',amenities:['Wi-Fi','Balcony']},
    {propertyId:mussoorie._id,number:'C01',floor:'Cottage',type:'Premium Cottage',capacity:4,baseRate:320,status:'vacant_clean',amenities:['Fireplace','Valley View']}
  ]);

  const guests = await Guest.insertMany([
    {propertyId:dehradun._id,firstName:'Aarav',lastName:'Mehta',email:'aarav@example.com',phone:'+91 9000000001',nationality:'Indian',vip:true,loyaltyTier:'gold',loyaltyPoints:4200,preferences:['High floor','Vegetarian']},
    {propertyId:dehradun._id,firstName:'Emma',lastName:'Wilson',email:'emma@example.com',phone:'+44 7700 900001',nationality:'British',vip:false,loyaltyTier:'silver',loyaltyPoints:1300,preferences:['Quiet room']},
    {propertyId:dehradun._id,firstName:'Riya',lastName:'Sharma',email:'riya@example.com',phone:'+91 9000000002',nationality:'Indian',vip:false,loyaltyTier:'member',loyaltyPoints:150}
  ]);

  const today = new Date(); const tomorrow=new Date(today); tomorrow.setDate(today.getDate()+1); const dayAfter=new Date(today); dayAfter.setDate(today.getDate()+3); const yesterday=new Date(today); yesterday.setDate(today.getDate()-1);
  const reservations = await Reservation.insertMany([
    {propertyId:dehradun._id,confirmationNumber:'RES-DEMO-001',guestId:guests[0]._id,roomId:rooms[0]._id,roomType:'Deluxe King',checkInDate:yesterday,checkOutDate:dayAfter,adults:2,children:0,source:'direct',status:'checked_in',ratePerNight:135,discountPercent:5,taxPercent:12,deposit:100,createdBy:byRole.receptionist._id,checkedInAt:yesterday},
    {propertyId:dehradun._id,confirmationNumber:'RES-DEMO-002',guestId:guests[1]._id,roomId:rooms[1]._id,roomType:'Deluxe Twin',checkInDate:today,checkOutDate:dayAfter,adults:1,children:0,source:'ota',status:'confirmed',ratePerNight:125,discountPercent:0,taxPercent:12,deposit:50,createdBy:byRole.receptionist._id},
    {propertyId:dehradun._id,confirmationNumber:'RES-DEMO-003',guestId:guests[2]._id,roomType:'Suite',checkInDate:tomorrow,checkOutDate:dayAfter,adults:2,children:1,source:'corporate',status:'confirmed',ratePerNight:270,discountPercent:10,taxPercent:12,deposit:0,createdBy:byRole.front_office_manager._id}
  ]);
  rooms[1].status='reserved'; await rooms[1].save();

  await Folio.create({propertyId:dehradun._id,folioNumber:'FOL-DEMO-001',reservationId:reservations[0]._id,guestId:guests[0]._id,status:'open',charges:[{description:'3 night room charge',department:'rooms',amount:384.75,tax:46.17,postedAt:yesterday,voided:false},{description:'Dinner - The Terrace',department:'food_beverage',amount:42,tax:2.1,postedAt:today,reference:'POS-DEMO-001',voided:false}],payments:[{method:'card',amount:100,reference:'Advance deposit',paidAt:yesterday}]});
  await HousekeepingTask.insertMany([
    {propertyId:dehradun._id,departmentId:'housekeeping',roomId:rooms[2]._id,type:'checkout_clean',priority:'high',status:'assigned',assignedTo:byRole.room_attendant._id,dueAt:new Date(Date.now()+3600000),notes:'Priority arrival room'},
    {propertyId:dehradun._id,departmentId:'housekeeping',roomId:rooms[0]._id,type:'stayover',priority:'normal',status:'open',dueAt:new Date(Date.now()+7200000)}
  ]);
  await WorkOrder.insertMany([
    {propertyId:dehradun._id,departmentId:'engineering',title:'Air conditioner not cooling',description:'Room 202 AC requires inspection',asset:'HVAC-202',roomId:rooms[4]._id,priority:'high',status:'assigned',assignedTo:byRole.technician._id,requestedBy:byRole.housekeeping_manager._id,partsCost:0,labourCost:0},
    {propertyId:dehradun._id,departmentId:'engineering',title:'Kitchen exhaust preventive service',asset:'KITCHEN-EXH-01',priority:'normal',status:'open',requestedBy:byRole.fnb_manager._id,partsCost:0,labourCost:0}
  ]);
  await InventoryItem.insertMany([
    {propertyId:dehradun._id,departmentId:'food_beverage',sku:'FB-COF-001',name:'Coffee Beans',category:'Beverage',unit:'kg',quantity:8,reorderLevel:10,unitCost:18},
    {propertyId:dehradun._id,departmentId:'housekeeping',sku:'HK-AMN-001',name:'Guest Amenity Kit',category:'Amenities',unit:'piece',quantity:240,reorderLevel:100,unitCost:2.5},
    {propertyId:dehradun._id,departmentId:'engineering',sku:'EN-BULB-012',name:'12W LED Bulb',category:'Electrical',unit:'piece',quantity:16,reorderLevel:20,unitCost:4.2}
  ]);
  await PurchaseRequisition.create({propertyId:dehradun._id,departmentId:'food_beverage',number:'PR-DEMO-001',title:'Restaurant monthly replenishment',lines:[{itemName:'Coffee Beans',quantity:25,unit:'kg',estimatedUnitCost:18},{itemName:'Premium Tea',quantity:20,unit:'box',estimatedUnitCost:12}],status:'submitted',requestedBy:byRole.fnb_manager._id});
  await Employee.insertMany([
    {propertyId:dehradun._id,employeeCode:'EMP001',name:'Neha Kapoor',email:'neha@grandstay.test',departmentId:'front_office',designation:'Receptionist',joiningDate:new Date('2025-01-10'),shift:'Morning',monthlySalary:620},
    {propertyId:dehradun._id,employeeCode:'EMP002',name:'Vikram Rawat',email:'vikram@grandstay.test',departmentId:'housekeeping',designation:'Room Attendant',joiningDate:new Date('2024-08-15'),shift:'Morning',monthlySalary:480},
    {propertyId:dehradun._id,employeeCode:'EMP003',name:'Kabir Joshi',email:'kabir@grandstay.test',departmentId:'engineering',designation:'HVAC Technician',joiningDate:new Date('2023-06-01'),shift:'General',monthlySalary:760}
  ]);
  await BanquetEvent.create({propertyId:dehradun._id,eventNumber:'EVT-DEMO-001',clientName:'Northstar Technologies',eventType:'Annual Conference',venue:'Emerald Ballroom',startAt:tomorrow,endAt:new Date(tomorrow.getTime()+8*3600000),guestCount:180,status:'confirmed',packageAmount:8200,advancePaid:3000,requirements:'Theatre seating, dual projectors, lunch buffet',ownerId:byRole.sales_manager._id});
  await Incident.create({propertyId:dehradun._id,departmentId:'security',number:'INC-DEMO-001',category:'Lost and Found',severity:'low',title:'Wallet found in lobby',description:'Brown leather wallet secured at security desk.',location:'Main Lobby',status:'open',reportedBy:byRole.security_manager._id});
  await PosOrder.create({propertyId:dehradun._id,departmentId:'food_beverage',orderNumber:'POS-DEMO-001',outlet:'The Terrace',tableNumber:'T12',roomId:rooms[0]._id,reservationId:reservations[0]._id,items:[{name:'Paneer Tikka',quantity:1,unitPrice:22,taxPercent:5},{name:'Fresh Lime Soda',quantity:2,unitPrice:10,taxPercent:5}],discount:0,paymentMode:'room_charge',status:'paid',createdBy:byRole.waiter._id});

  await AuditLog.create({propertyId:dehradun._id,userId:byRole.corporate_admin._id,action:'seed',entity:'System',after:{message:'Demo environment created'}});
  console.log('\nGrandStay Hotel ERP seeded successfully.');
  console.log('Login: corporate_admin@grandstay.test');
  console.log('Password: Hotel@123');
  console.log('Every seeded role uses the same password and <role_code>@grandstay.test email.\n');
  await mongoose.disconnect();
}
seed().catch(async error=>{console.error(error);await mongoose.disconnect();process.exit(1);});
