export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  userType: string;
  city?: string; // Optional city for Store Managers
}

export interface AdminUserInfo {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  userType: string;
  city?: string; // Optional city for Store Managers
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



