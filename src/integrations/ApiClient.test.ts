import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from './ApiClient';

// Mock axios
const mockInterceptors = {
  request: { use: vi.fn() },
  response: { use: vi.fn() },
};

const mockAxiosInstance = {
  interceptors: mockInterceptors,
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

describe('ApiClient', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create axios instance with correct configuration', () => {
      const axios = require('axios').default;
      const instance = ApiClient.create();

      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://api-dev.huongcungbookstore.com/api',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(instance).toBe(mockAxiosInstance);
    });

    it('should return same instance on multiple calls', () => {
      const instance1 = ApiClient.create();
      const instance2 = ApiClient.create();

      expect(instance1).toBe(instance2);
    });

    it('should set up request interceptor', () => {
      ApiClient.create();
      expect(mockInterceptors.request.use).toHaveBeenCalled();
    });

    it('should set up response interceptor', () => {
      ApiClient.create();
      expect(mockInterceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Request Interceptor', () => {
    it('should inject JWT token in Authorization header when token exists', () => {
      localStorage.setItem('admin_token', 'test-jwt-token');
      localStorage.setItem('admin_tokenType', 'Bearer');

      ApiClient.create();

      // Get the request interceptor function
      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      const mockConfig = { headers: {} };

      const result = requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
    });

    it('should not inject token when token does not exist', () => {
      ApiClient.create();

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      const mockConfig = { headers: {} };

      const result = requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should use Bearer as default tokenType when not specified', () => {
      localStorage.setItem('admin_token', 'test-jwt-token');

      ApiClient.create();

      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];
      const mockConfig = { headers: {} };

      const result = requestInterceptor(mockConfig);

      expect(result.headers.Authorization).toBe('Bearer test-jwt-token');
    });
  });

  describe('Response Interceptor', () => {
    it('should clear auth data on 401 response', () => {
      localStorage.setItem('admin_token', 'test-token');
      localStorage.setItem('admin_userId', '1');

      // Mock window.location
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { href: '' };

      ApiClient.create();

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
      };

      errorHandler(mockError);

      expect(localStorage.getItem('admin_token')).toBeNull();
      expect(localStorage.getItem('admin_userId')).toBeNull();

      // Restore window.location
      window.location = originalLocation;
    });

    it('should return error message on 403 response', async () => {
      ApiClient.create();

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const mockError = {
        response: {
          status: 403,
          data: {
            error: {
              message: 'Access denied',
            },
          },
        },
      };

      await expect(errorHandler(mockError)).rejects.toThrow('Access denied');
    });

    it('should handle network errors', async () => {
      ApiClient.create();

      const errorHandler = mockInterceptors.response.use.mock.calls[0][1];
      const mockError = {
        // No response property indicates network error
      };

      await expect(errorHandler(mockError)).rejects.toThrow('Network error');
    });
  });
});
