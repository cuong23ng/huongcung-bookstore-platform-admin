import type { StaffRole } from "./Staff";

export interface LoginRequest {
  username: string; // Backend uses 'username' field
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  username: string; // Backend returns username
  email: string;
  firstName: string;
  lastName: string;
  roles: StaffRole[];
  // Note: userType and city are not returned by backend AuthResponse
  // They may be available in other endpoints if needed
}

export interface AdminUserInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: StaffRole[];
  // Note: userType and city are not in AuthResponse
  // They may be available from other endpoints if needed
  userType?: string; // Optional, may not be available
  city?: string; // Optional, may not be available
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}























