import type { PaginationInfo } from './PaginationInfo';
import type { City } from '../enum/Common';

export type StaffRole = 'ROLE_ADMIN' | 'ROLE_STORE_MANAGER' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_WAREHOUSE_STAFF' | 'ROLE_SUPPORT_AGENT';

export interface Staff {
  id: number;
  username?: string;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  city?: City;
  warehouse?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  fullName: string;
  username?: string;
  email: string;
  phone: string;
  password: string;
  gender?: string;
  role: StaffRole;
  city?: City;
  warehouseCode?: string;
}

export interface UpdateStaffRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  city?: City;
}

export interface GetStaffResponse {
  staffs: Staff[];
  pagination: PaginationInfo;
}

export interface GetAllStaffParams {
  page?: number;
  size?: number;
  staffType?: StaffRole;
  assignedCity?: City;
  warehouse?: string;
}























