export type StaffRole = 'ADMIN' | 'STORE_MANAGER' | 'SUPPORT_AGENT';
export type City = 'Hanoi' | 'HCMC' | 'Da Nang';

export interface Staff {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: StaffRole;
  city?: City;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: StaffRole;
  city?: City;
}

export interface UpdateStaffRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: StaffRole;
  city?: City;
}



