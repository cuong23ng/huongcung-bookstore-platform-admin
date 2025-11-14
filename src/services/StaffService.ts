import { ApiClient } from '../integrations/ApiClient';
import { Staff, CreateStaffRequest, UpdateStaffRequest, ApiResponse } from '../models';
import { AxiosInstance, AxiosError } from 'axios';

export class StaffService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): StaffService {
    return new StaffService();
  }

  public async getAllStaff(): Promise<Staff[]> {
    try {
      // Backend returns: { data: { staff: [...], pagination: {...} }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<any>('/admin/staff');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch staff list');
      }
      
      // Backend returns data in format: { data: { staff: [...], pagination: {...} } }
      let staffArray: any[] = [];
      if (response.data?.data) {
        // Check if data is an object with 'staff' property (paginated response)
        if (typeof response.data.data === 'object' && 'staff' in response.data.data) {
          staffArray = response.data.data.staff || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        else if (Array.isArray(response.data.data)) {
          staffArray = response.data.data;
        }
      }
      
      if (staffArray.length === 0 && !response.data?.data) {
        throw new Error('Invalid response format from server');
      }
      
      // Transform backend fields to frontend model
      // Backend: staffType, firstName, lastName, assignedCity
      // Frontend: role, fullName, city
      return staffArray.map((staff: any) => ({
        id: staff.id,
        fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        email: staff.email,
        phone: staff.phone || '',
        role: (staff.role || staff.staffType || '').toUpperCase() as any,
        city: staff.city || staff.assignedCity,
        createdAt: staff.createdAt || staff.hireDate,
        updatedAt: staff.updatedAt,
      }));
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch staff list. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async createStaff(data: CreateStaffRequest): Promise<Staff> {
    try {
      // Transform frontend format to backend format
      // Frontend: fullName, role, city
      // Backend: firstName, lastName, staffType, assignedCity
      const fullNameParts = data.fullName.trim().split(/\s+/);
      const firstName = fullNameParts[0] || '';
      const lastName = fullNameParts.slice(1).join(' ') || '';
      
      // Map role to staffType (backend uses StaffType enum)
      // Backend expects: STORE_MANAGER, SUPPORT_AGENT (not ADMIN)
      const staffType = data.role === 'ADMIN' 
        ? 'ADMIN' // This will be rejected by backend, but we'll send it anyway
        : data.role === 'STORE_MANAGER' 
          ? 'STORE_MANAGER'
          : data.role === 'SUPPORT_AGENT'
            ? 'SUPPORT_AGENT'
            : data.role;
      
      const backendRequest = {
        email: data.email,
        password: data.password,
        firstName: firstName,
        lastName: lastName || firstName, // If no lastName, use firstName as fallback
        phone: data.phone,
        staffType: staffType,
        assignedCity: data.city || undefined,
      };
      
      const response = await this.apiFetcher.post<any>('/admin/staff', backendRequest);
      
      // Backend returns: { data: StaffDTO, message?: string, errorCode?: string }
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create staff');
      }
      
      if (response.data?.data) {
        // Transform backend response to frontend format
        const staffData = response.data.data;
        return {
          id: staffData.id,
          fullName: staffData.fullName || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim(),
          email: staffData.email,
          phone: staffData.phone || '',
          role: (staffData.role || staffData.staffType || '').toUpperCase() as any,
          city: staffData.city || staffData.assignedCity,
          createdAt: staffData.createdAt || staffData.hireDate,
          updatedAt: staffData.updatedAt,
        };
      }
      
      throw new Error(response.data?.message || 'Failed to create staff');
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle validation errors with details
        const errorData = error.response?.data as any;
        if (errorData?.details) {
          // Format validation errors
          const details = errorData.details;
          const errorMessages = Object.entries(details)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new Error(errorMessages || errorData.message || 'Validation failed');
        }
        
        const errorMessage = 
          errorData?.error?.message ||
          errorData?.message ||
          error.message ||
          'Failed to create staff. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async updateStaff(id: number, data: UpdateStaffRequest): Promise<Staff> {
    try {
      // Transform frontend format to backend format
      // Frontend: fullName?, role?, city?
      // Backend: firstName?, lastName?, staffType?, assignedCity?
      // Note: email cannot be updated (per backend mapper)
      const backendRequest: any = {};
      
      if (data.phone !== undefined) {
        backendRequest.phone = data.phone;
      }
      
      // Split fullName into firstName and lastName if provided
      if (data.fullName !== undefined) {
        const fullNameParts = data.fullName.trim().split(/\s+/);
        backendRequest.firstName = fullNameParts[0] || '';
        backendRequest.lastName = fullNameParts.slice(1).join(' ') || backendRequest.firstName;
      }
      
      // Map role to staffType if provided
      if (data.role !== undefined) {
        backendRequest.staffType = data.role === 'ADMIN' 
          ? 'ADMIN'
          : data.role === 'STORE_MANAGER' 
            ? 'STORE_MANAGER'
            : data.role === 'SUPPORT_AGENT'
              ? 'SUPPORT_AGENT'
              : data.role;
      }
      
      // Map city to assignedCity if provided
      if (data.city !== undefined) {
        backendRequest.assignedCity = data.city || undefined;
      }
      
      const response = await this.apiFetcher.put<any>(`/admin/staff/${id}`, backendRequest);
      
      // Backend returns: { data: StaffDTO, message?: string, errorCode?: string }
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update staff');
      }
      
      if (response.data?.data) {
        // Transform backend response to frontend format
        const staffData = response.data.data;
        return {
          id: staffData.id,
          fullName: staffData.fullName || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim(),
          email: staffData.email,
          phone: staffData.phone || '',
          role: (staffData.role || staffData.staffType || '').toUpperCase() as any,
          city: staffData.city || staffData.assignedCity,
          createdAt: staffData.createdAt || staffData.hireDate,
          updatedAt: staffData.updatedAt,
        };
      }
      
      throw new Error(response.data?.message || 'Failed to update staff');
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle validation errors with details
        const errorData = error.response?.data as any;
        if (errorData?.details) {
          // Format validation errors
          const details = errorData.details;
          const errorMessages = Object.entries(details)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          throw new Error(errorMessages || errorData.message || 'Validation failed');
        }
        
        const errorMessage = 
          errorData?.error?.message ||
          errorData?.message ||
          error.message ||
          'Failed to update staff. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async deleteStaff(id: number): Promise<void> {
    try {
      const response = await this.apiFetcher.delete<ApiResponse<null>>(`/admin/staff/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete staff');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        
        if (status === 404) {
          throw new Error('Staff member not found');
        } else if (status === 403) {
          throw new Error('You do not have permission to delete staff members');
        }
        
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to delete staff. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

