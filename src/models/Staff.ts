export type StaffRole = 'ADMIN' | 'STORE_MANAGER' | 'SUPPORT_AGENT';
export type City = 'Hanoi' | 'HCMC' | 'Da Nang';

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

export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
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























