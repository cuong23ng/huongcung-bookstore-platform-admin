import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

export class ApiClient {
  private static instance: AxiosInstance | null = null;

  public static create(): AxiosInstance {
    if (this.instance) {
      return this.instance;
    }

    const instance = axios.create({
      baseURL: 'http://localhost:8082/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Inject JWT token
    instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('admin_token');
        const tokenType = localStorage.getItem('admin_tokenType') || 'Bearer';

        if (token) {
          config.headers.Authorization = `${tokenType} ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor: Handle 401/403 errors
    instance.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;

          // Handle 401 Unauthorized: Clear auth and redirect to login
          if (status === 401) {
            // Clear admin auth data
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_tokenType');
            localStorage.removeItem('admin_userId');
            localStorage.removeItem('admin_userEmail');
            localStorage.removeItem('admin_userFirstName');
            localStorage.removeItem('admin_userLastName');
            localStorage.removeItem('admin_userRoles');
            localStorage.removeItem('admin_userType');
            localStorage.removeItem('admin_userCity');

            // Redirect to login (only if we're in browser environment)
            if (typeof window !== 'undefined') {
              window.location.href = '/admin/login';
            }
          }

          // Handle 403 Forbidden: Return error with message
          if (status === 403) {
            const errorMessage = 
              (error.response.data as any)?.error?.message ||
              (error.response.data as any)?.message ||
              'Access denied. You do not have permission to perform this action.';
            return Promise.reject(new Error(errorMessage));
          }
        }

        // Handle network errors
        if (!error.response) {
          return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        // Handle other errors
        const errorMessage = 
          (error.response.data as any)?.error?.message ||
          (error.response.data as any)?.message ||
          error.message ||
          'An error occurred. Please try again.';

        return Promise.reject(new Error(errorMessage));
      }
    );

    this.instance = instance;
    return instance;
  }
}



