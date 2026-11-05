export const PERMISSIONS = [
  'dashboard.read',
  'properties.read', 'properties.manage',
  'roles.read', 'roles.manage',
  'users.read', 'users.manage',
  'guests.read', 'guests.manage',
  'rooms.read', 'rooms.manage', 'rooms.status',
  'reservations.read', 'reservations.manage', 'reservations.checkin', 'reservations.checkout', 'reservations.cancel', 'reservations.discount',
  'housekeeping.read', 'housekeeping.manage', 'housekeeping.assign', 'housekeeping.inspect',
  'pos.read', 'pos.manage', 'pos.discount', 'pos.void',
  'folios.read', 'folios.manage', 'folios.settle', 'folios.refund',
  'inventory.read', 'inventory.manage', 'inventory.adjust',
  'procurement.read', 'procurement.manage', 'procurement.approve',
  'maintenance.read', 'maintenance.manage', 'maintenance.assign', 'maintenance.close',
  'employees.read', 'employees.manage', 'employees.payroll',
  'banquets.read', 'banquets.manage',
  'security.read', 'security.manage',
  'reports.read', 'audit.read', 'settings.manage'
] as const;

export type Permission = typeof PERMISSIONS[number];
export type Scope = 'corporate' | 'property' | 'department' | 'self';
