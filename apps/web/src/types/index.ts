export interface Role { _id:string; name:string; code:string; level:1|2|3; scope:'corporate'|'property'|'department'|'self'; permissions:string[]; }
export interface PropertyOption { _id:string; name:string; code:string; currency:string; }
export interface AuthUser { _id:string; name:string; email:string; role:Role; propertyIds:string[]; properties:PropertyOption[]; departmentIds:string[]; active:boolean; }
export interface PageResponse<T=Record<string,unknown>> { data:T[]; meta?:{total:number;page:number;limit:number;pages:number}; }
