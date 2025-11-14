import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StaffService } from './StaffService';
import { ApiClient } from '../integrations/ApiClient';
import type { Staff, CreateStaffRequest, UpdateStaffRequest, StaffRole, City } from '../models/Staff';
import { AxiosError } from 'axios';

// Mock ApiClient
vi.mock('../integrations/ApiClient', () => ({
  ApiClient: {
    create: vi.fn(),
  },
}));

describe('StaffService', () => {
  let mockAxiosInstance: any;
  let staffService: StaffService;

  beforeEach(() => {
    // Create a mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Mock ApiClient.create to return the mock instance
    vi.mocked(ApiClient.create).mockReturnValue(mockAxiosInstance as any);

    // Get a new instance of StaffService
    staffService = StaffService.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = StaffService.getInstance();
      const instance2 = StaffService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAllStaff', () => {
    it('should fetch all staff successfully', async () => {
      const mockStaff: Staff[] = [
        {
          id: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          role: 'ADMIN' as StaffRole,
        },
        {
          id: 2,
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          phone: '0987654321',
          role: 'STORE_MANAGER' as StaffRole,
          city: 'Hanoi' as City,
        },
      ];

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: mockStaff,
          message: 'Staff list retrieved successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      const result = await staffService.getAllStaff();

      expect(result).toEqual(mockStaff);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/admin/staff');
    });

    it('should throw error when API response is not successful', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: false,
          message: 'Failed to fetch staff',
        },
      });

      await expect(staffService.getAllStaff()).rejects.toThrow('Failed to fetch staff');
    });

    it('should throw error when API response has no data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          message: 'No data',
        },
      });

      await expect(staffService.getAllStaff()).rejects.toThrow('Failed to fetch staff list');
    });

    it('should handle AxiosError with error message', async () => {
      const axiosError = new AxiosError('Network error');
      axiosError.response = {
        data: {
          error: {
            message: 'Unauthorized access',
          },
        },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(staffService.getAllStaff()).rejects.toThrow('Unauthorized access');
    });

    it('should handle AxiosError with fallback message', async () => {
      const axiosError = new AxiosError('Network error');
      axiosError.response = {
        data: {
          message: 'Server error',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(staffService.getAllStaff()).rejects.toThrow('Server error');
    });

    it('should handle network errors', async () => {
      const axiosError = new AxiosError('Network error');
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(staffService.getAllStaff()).rejects.toThrow('Network error');
    });
  });

  describe('createStaff', () => {
    it('should create staff successfully', async () => {
      const createRequest: CreateStaffRequest = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'ADMIN' as StaffRole,
      };

      const mockCreatedStaff: Staff = {
        id: 1,
        ...createRequest,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockCreatedStaff,
          message: 'Staff created successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      const result = await staffService.createStaff(createRequest);

      expect(result).toEqual(mockCreatedStaff);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/admin/staff', createRequest);
    });

    it('should create staff with city for Store Manager', async () => {
      const createRequest: CreateStaffRequest = {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0987654321',
        password: 'password123',
        role: 'STORE_MANAGER' as StaffRole,
        city: 'Hanoi' as City,
      };

      const mockCreatedStaff: Staff = {
        id: 2,
        ...createRequest,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: true,
          data: mockCreatedStaff,
          message: 'Staff created successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      const result = await staffService.createStaff(createRequest);

      expect(result).toEqual(mockCreatedStaff);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/admin/staff', createRequest);
    });

    it('should throw error when creation fails', async () => {
      const createRequest: CreateStaffRequest = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'ADMIN' as StaffRole,
      };

      mockAxiosInstance.post.mockResolvedValue({
        data: {
          success: false,
          message: 'Email already exists',
        },
      });

      await expect(staffService.createStaff(createRequest)).rejects.toThrow('Email already exists');
    });

    it('should handle AxiosError with error message', async () => {
      const createRequest: CreateStaffRequest = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'password123',
        role: 'ADMIN' as StaffRole,
      };

      const axiosError = new AxiosError('Validation error');
      axiosError.response = {
        data: {
          error: {
            message: 'Invalid email format',
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);

      await expect(staffService.createStaff(createRequest)).rejects.toThrow('Invalid email format');
    });
  });

  describe('updateStaff', () => {
    it('should update staff successfully', async () => {
      const updateRequest: UpdateStaffRequest = {
        fullName: 'John Updated',
        email: 'john.updated@example.com',
      };

      const mockUpdatedStaff: Staff = {
        id: 1,
        fullName: 'John Updated',
        email: 'john.updated@example.com',
        phone: '1234567890',
        role: 'ADMIN' as StaffRole,
      };

      mockAxiosInstance.put.mockResolvedValue({
        data: {
          success: true,
          data: mockUpdatedStaff,
          message: 'Staff updated successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      const result = await staffService.updateStaff(1, updateRequest);

      expect(result).toEqual(mockUpdatedStaff);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/staff/1', updateRequest);
    });

    it('should update staff role and city', async () => {
      const updateRequest: UpdateStaffRequest = {
        role: 'STORE_MANAGER' as StaffRole,
        city: 'HCMC' as City,
      };

      const mockUpdatedStaff: Staff = {
        id: 1,
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        role: 'STORE_MANAGER' as StaffRole,
        city: 'HCMC' as City,
      };

      mockAxiosInstance.put.mockResolvedValue({
        data: {
          success: true,
          data: mockUpdatedStaff,
          message: 'Staff updated successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      const result = await staffService.updateStaff(1, updateRequest);

      expect(result).toEqual(mockUpdatedStaff);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/admin/staff/1', updateRequest);
    });

    it('should throw error when update fails', async () => {
      const updateRequest: UpdateStaffRequest = {
        fullName: 'John Updated',
      };

      mockAxiosInstance.put.mockResolvedValue({
        data: {
          success: false,
          message: 'Staff not found',
        },
      });

      await expect(staffService.updateStaff(999, updateRequest)).rejects.toThrow('Staff not found');
    });

    it('should handle AxiosError with error message', async () => {
      const updateRequest: UpdateStaffRequest = {
        email: 'invalid-email',
      };

      const axiosError = new AxiosError('Validation error');
      axiosError.response = {
        data: {
          error: {
            message: 'Invalid email format',
          },
        },
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.put.mockRejectedValue(axiosError);

      await expect(staffService.updateStaff(1, updateRequest)).rejects.toThrow('Invalid email format');
    });
  });

  describe('deleteStaff', () => {
    it('should delete staff successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          success: true,
          data: null,
          message: 'Staff deleted successfully',
          timestamp: '2025-01-01T00:00:00Z',
        },
      });

      await staffService.deleteStaff(1);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/admin/staff/1');
    });

    it('should throw error when deletion fails', async () => {
      mockAxiosInstance.delete.mockResolvedValue({
        data: {
          success: false,
          message: 'Failed to delete staff',
        },
      });

      await expect(staffService.deleteStaff(1)).rejects.toThrow('Failed to delete staff');
    });

    it('should handle 404 error (staff not found)', async () => {
      const axiosError = new AxiosError('Not found');
      axiosError.response = {
        data: {
          error: {
            message: 'Staff member not found',
          },
        },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      await expect(staffService.deleteStaff(999)).rejects.toThrow('Staff member not found');
    });

    it('should handle 403 error (no permission)', async () => {
      const axiosError = new AxiosError('Forbidden');
      axiosError.response = {
        data: {
          error: {
            message: 'Access denied',
          },
        },
        status: 403,
        statusText: 'Forbidden',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      await expect(staffService.deleteStaff(1)).rejects.toThrow('You do not have permission to delete staff members');
    });

    it('should handle AxiosError with fallback message', async () => {
      const axiosError = new AxiosError('Server error');
      axiosError.response = {
        data: {
          message: 'Internal server error',
        },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: {} as any,
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      await expect(staffService.deleteStaff(1)).rejects.toThrow('Internal server error');
    });

    it('should handle network errors', async () => {
      const axiosError = new AxiosError('Network error');
      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      await expect(staffService.deleteStaff(1)).rejects.toThrow('Network error');
    });
  });
});



