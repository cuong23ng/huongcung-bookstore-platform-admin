import { ApiClient } from '../integrations/ApiClient';
import type { Staff, CreateStaffRequest, UpdateStaffRequest, ApiResponse, GetStaffResponse, GetAllStaffParams } from '../models';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export class StaffService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): StaffService {
    return new StaffService();
  }

  public async getAllStaff(params?: GetAllStaffParams): Promise<GetStaffResponse> {
    try {
      // Build query parameters
      const queryParams: any = {};
      if (params?.page !== undefined) {
        queryParams.page = params.page;
      }
      if (params?.size !== undefined) {
        queryParams.size = params.size;
      }
      if (params?.staffType) {
        queryParams.staffType = params.staffType;
      }
      if (params?.assignedCity) {
        queryParams.assignedCity = params.assignedCity;
      }
      if (params?.warehouse) {
        queryParams.warehouse = params.warehouse;
      }

      // Backend returns: { data: { staffs: [...], pagination: {...} }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<any>('/admin/staff', { params: queryParams });
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch staff list');
      }
      
      // Backend returns data in format: { data: { staffs: [...], pagination: {...} } }
      if (!response.data?.data) {
        throw new Error('Invalid response format from server');
      }

      const responseData = response.data.data;

      const staffs = (responseData.staffs || []).map((staff: any) => ({
        id: staff.id,
        username: staff.username,
        fullName: staff.fullName || `${staff.firstName || ''} ${staff.lastName || ''}`.trim(),
        email: staff.email,
        phone: staff.phone || '',
        role: (staff.role || staff.staffType || '').toUpperCase() as any,
        city: staff.city || staff.assignedCity,
        warehouse: staff.warehouse || staff.warehouseCode,
        createdAt: staff.createdAt || staff.hireDate,
        updatedAt: staff.updatedAt,
      }));

      return {
        staffs,
        pagination: responseData.pagination || {
          currentPage: 1,
          pageSize: 20,
          totalResults: 0,
          totalPages: 0,
          hasNext: false,
          hasPrevious: false,
        },
      };
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

      const fullNameParts = data.fullName.trim().split(/\s+/);
      const firstName = fullNameParts[0] || '';
      const lastName = fullNameParts.slice(1).join(' ') || firstName;
      
      // Map role to staffType (backend uses StaffType enum)
      const staffType = data.role === 'ADMIN' 
        ? 'ADMIN'
        : data.role === 'STORE_MANAGER' 
          ? 'STORE_MANAGER'
          : data.role === 'SUPPORT_AGENT'
            ? 'SUPPORT_AGENT'
            : data.role === 'WAREHOUSE_MANAGER'
              ? 'WAREHOUSE_MANAGER'
              : data.role === 'WAREHOUSE_STAFF'
                ? 'WAREHOUSE_STAFF'
                : data.role;
      
      const username = data.username || data.email;
      
      const backendRequest = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: data.email,
        password: data.password,
        phone: data.phone,
        gender: data.gender || 'OTHER',
        staffType: staffType,
        city: data.city || undefined,
        warehouse: data.warehouseCode || undefined,
      };
      
      const response = await this.apiFetcher.post<any>('/admin/auth/register', backendRequest);
      
      if (response.data?.id) {
        const authData = response.data;
        const staffDetails = await this.getStaffById(authData.id);
        return staffDetails;
      }
      
      if (response.data) {
        const authData = response.data;
        return {
          id: authData.id,
          username: authData.username,
          fullName: `${authData.firstName || ''} ${authData.lastName || ''}`.trim(),
          email: authData.email,
          phone: '', // Not in AuthResponse, will be empty
          role: (authData.roles?.[0] || '').replace('ROLE_', '').toUpperCase() as any,
          city: undefined, // Not in AuthResponse
          createdAt: undefined,
          updatedAt: undefined,
        };
      }
      
      throw new Error('Failed to create staff - invalid response');
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
  
  private async getStaffById(id: number): Promise<Staff> {
    try {
      const response = await this.apiFetcher.get<any>(`/admin/staff/${id}`);
      
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch staff details');
      }
      
      if (response.data?.data) {
        const staffData = response.data.data;
        return {
          id: staffData.id,
          username: staffData.username,
          fullName: staffData.fullName || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim(),
          email: staffData.email,
          phone: staffData.phone || '',
          role: (staffData.role || staffData.staffType || '').toUpperCase() as any,
          city: staffData.city || staffData.assignedCity,
          warehouse: staffData.warehouse || staffData.warehouseCode,
          createdAt: staffData.createdAt || staffData.hireDate,
          updatedAt: staffData.updatedAt,
        };
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      // If getStaffById fails, return empty staff (will be handled by fallback)
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
          username: staffData.username,
          fullName: staffData.fullName || `${staffData.firstName || ''} ${staffData.lastName || ''}`.trim(),
          email: staffData.email,
          phone: staffData.phone || '',
          role: (staffData.role || staffData.staffType || '').toUpperCase() as any,
          city: staffData.city || staffData.assignedCity,
          warehouse: staffData.warehouse || staffData.warehouseCode,
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

