import { ApiClient } from '../integrations/ApiClient';
import type { LoginRequest, AuthResponse, AdminUserInfo } from '../models/AdminAuth';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export class AdminAuthService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): AdminAuthService {
    return new AdminAuthService();
  }

  public isAuthenticated(): boolean {
    return this.getToken() !== null && this.getTokenType() !== null;
  }

  public async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Backend returns LoginResponse directly, not wrapped in ApiResponse
      const response = await this.apiFetcher.post<AuthResponse>('/auth/login', data);
      const authData = response.data;
      this.saveAuthData(authData);
      return authData;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as { error?: { message?: string }; message?: string } | undefined;
        const errorMessage = 
          errorData?.error?.message ||
          errorData?.message ||
          error.message ||
          'Login failed. Please check your credentials.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async logout(): Promise<void> {
    const token = this.getToken();
    const tokenType = this.getTokenType();

    if (token && tokenType) {
      try {
        await this.apiFetcher.post('/auth/logout', {});
      } catch (error) {
        // Even if logout API call fails, clear local auth data
        console.error('Logout API call failed:', error);
      }
    }
    
    this.clearAuthData();
  }

  private getToken(): string | null {
    return localStorage.getItem('admin_token');
  }

  private getTokenType(): string | null {
    return localStorage.getItem('admin_tokenType');
  }

  private saveAuthData(authData: AuthResponse): void {
    localStorage.setItem('admin_token', authData.token);
    localStorage.setItem('admin_tokenType', authData.type || 'Bearer');
    localStorage.setItem('admin_userId', authData.id.toString());
    localStorage.setItem('admin_userEmail', authData.email);
    localStorage.setItem('admin_userFirstName', authData.firstName);
    localStorage.setItem('admin_userLastName', authData.lastName);
    localStorage.setItem('admin_userRoles', JSON.stringify(authData.roles));
    localStorage.setItem('admin_userType', authData.userType);
    
    // Store city if provided (for Store Managers)
    if (authData.city) {
      localStorage.setItem('admin_userCity', authData.city);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_tokenType');
    localStorage.removeItem('admin_userId');
    localStorage.removeItem('admin_userEmail');
    localStorage.removeItem('admin_userFirstName');
    localStorage.removeItem('admin_userLastName');
    localStorage.removeItem('admin_userRoles');
    localStorage.removeItem('admin_userType');
    localStorage.removeItem('admin_userCity');
  }

  public getAuthData(): AdminUserInfo | null {
    const token = this.getToken();
    const tokenType = this.getTokenType();

    if (!token || !tokenType) {
      return null;
    }

    const userId = localStorage.getItem('admin_userId');
    const email = localStorage.getItem('admin_userEmail');
    const firstName = localStorage.getItem('admin_userFirstName');
    const lastName = localStorage.getItem('admin_userLastName');
    const roles = localStorage.getItem('admin_userRoles');
    const userType = localStorage.getItem('admin_userType');
    const city = localStorage.getItem('admin_userCity');

    if (!userId || !email) {
      return null;
    }

    return {
      id: Number.parseInt(userId, 10),
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      roles: roles ? JSON.parse(roles) : [],
      userType: userType || '',
      city: city || undefined,
    };
  }
}

// Export convenience functions for easier usage
export const getAuthData = (): AdminUserInfo | null => {
  return AdminAuthService.getInstance().getAuthData();
};

export const logout = async (): Promise<void> => {
  return AdminAuthService.getInstance().logout();
};

