import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminAuthService } from './AdminAuthService';
import type { LoginRequest } from '../models/AdminAuth';

// Mock ApiClient
const mockPost = vi.fn();
const mockAxiosInstance = {
  post: mockPost,
};

vi.mock('../integrations/ApiClient', () => ({
  ApiClient: {
    create: () => mockAxiosInstance,
  },
}));

describe('AdminAuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AdminAuthService.getInstance();
      const instance2 = AdminAuthService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      const service = AdminAuthService.getInstance();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false when only token exists without tokenType', () => {
      localStorage.setItem('admin_token', 'test-token');
      const service = AdminAuthService.getInstance();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return true when both token and tokenType exist', () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');
      const service = AdminAuthService.getInstance();
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('login', () => {
    it('should successfully login and store auth data', async () => {
      const mockAuthResponse = {
        data: {
          success: true,
          data: {
            token: 'test-jwt-token',
            type: 'Bearer',
            id: 1,
            email: 'admin@test.com',
            firstName: 'John',
            lastName: 'Doe',
            roles: ['ADMIN'],
            userType: 'STAFF',
          },
          message: 'Login successful',
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      mockPost.mockResolvedValue(mockAuthResponse);

      const service = AdminAuthService.getInstance();
      const loginData: LoginRequest = {
        email: 'admin@test.com',
        password: 'password123',
      };

      const result = await service.login(loginData);

      expect(mockPost).toHaveBeenCalledWith('/auth/login', loginData);
      expect(result.token).toBe('test-jwt-token');
      expect(localStorage.getItem('admin_token')).toBe('test-jwt-token');
      expect(localStorage.getItem('admin_tokenType')).toBe('Bearer');
      expect(localStorage.getItem('admin_userId')).toBe('1');
      expect(localStorage.getItem('admin_userEmail')).toBe('admin@test.com');
      expect(localStorage.getItem('admin_userFirstName')).toBe('John');
      expect(localStorage.getItem('admin_userLastName')).toBe('Doe');
    });

    it('should store city for Store Managers', async () => {
      const mockAuthResponse = {
        data: {
          success: true,
          data: {
            token: 'test-jwt-token',
            type: 'Bearer',
            id: 2,
            email: 'manager@test.com',
            firstName: 'Jane',
            lastName: 'Smith',
            roles: ['STORE_MANAGER'],
            userType: 'STAFF',
            city: 'Hanoi',
          },
          message: 'Login successful',
          timestamp: '2025-01-01T00:00:00Z',
        },
      };

      mockPost.mockResolvedValue(mockAuthResponse);

      const service = AdminAuthService.getInstance();
      const loginData: LoginRequest = {
        email: 'manager@test.com',
        password: 'password123',
      };

      await service.login(loginData);

      expect(localStorage.getItem('admin_userCity')).toBe('Hanoi');
    });

    it('should throw error when login fails', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Invalid email or password',
            },
          },
        },
      };

      mockPost.mockRejectedValue(errorResponse);

      const service = AdminAuthService.getInstance();
      const loginData: LoginRequest = {
        email: 'wrong@test.com',
        password: 'wrongpassword',
      };

      await expect(service.login(loginData)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should clear auth data from localStorage', async () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');
      localStorage.setItem('admin_userId', '1');
      localStorage.setItem('admin_userEmail', 'test@test.com');

      mockPost.mockResolvedValue({});

      const service = AdminAuthService.getInstance();
      await service.logout();

      expect(localStorage.getItem('admin_token')).toBeNull();
      expect(localStorage.getItem('admin_tokenType')).toBeNull();
      expect(localStorage.getItem('admin_userId')).toBeNull();
      expect(localStorage.getItem('admin_userEmail')).toBeNull();
    });

    it('should clear auth data even if logout API call fails', async () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');

      mockPost.mockRejectedValue(new Error('Network error'));

      const service = AdminAuthService.getInstance();
      await service.logout();

      expect(localStorage.getItem('admin_token')).toBeNull();
    });
  });

  describe('getAuthData', () => {
    it('should return null when no token exists', () => {
      const service = AdminAuthService.getInstance();
      expect(service.getAuthData()).toBeNull();
    });

    it('should return null when token exists but user data is incomplete', () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');

      const service = AdminAuthService.getInstance();
      expect(service.getAuthData()).toBeNull();
    });

    it('should return user info when all data exists', () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');
      localStorage.setItem('admin_userId', '1');
      localStorage.setItem('admin_userEmail', 'test@test.com');
      localStorage.setItem('admin_userFirstName', 'John');
      localStorage.setItem('admin_userLastName', 'Doe');
      localStorage.setItem('admin_userRoles', JSON.stringify(['ADMIN']));
      localStorage.setItem('admin_userType', 'STAFF');

      const service = AdminAuthService.getInstance();
      const userInfo = service.getAuthData();

      expect(userInfo).toEqual({
        id: 1,
        email: 'test@test.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['ADMIN'],
        userType: 'STAFF',
      });
    });

    it('should include city when present', () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_tokenType', 'Bearer');
      localStorage.setItem('admin_userId', '2');
      localStorage.setItem('admin_userEmail', 'manager@test.com');
      localStorage.setItem('admin_userFirstName', 'Jane');
      localStorage.setItem('admin_userLastName', 'Smith');
      localStorage.setItem('admin_userRoles', JSON.stringify(['STORE_MANAGER']));
      localStorage.setItem('admin_userType', 'STAFF');
      localStorage.setItem('admin_userCity', 'Hanoi');

      const service = AdminAuthService.getInstance();
      const userInfo = service.getAuthData();

      expect(userInfo?.city).toBe('Hanoi');
    });
  });
});
