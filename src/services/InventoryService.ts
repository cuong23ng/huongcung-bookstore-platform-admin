import { ApiClient } from '../integrations/ApiClient';
import { 
  StockLevel, 
  AdjustStockRequest, 
  StockAdjustmentRequest,
  PaginatedStockAdjustments,
  ApiResponse, 
  City, 
  PaginatedStockLevels, 
  AvailabilityStatus 
} from '../models';
import { AxiosInstance, AxiosError } from 'axios';

export interface GetStockLevelsParams {
  page?: number;
  size?: number;
  city?: City;
  bookTitle?: string;
  availabilityStatus?: AvailabilityStatus;
  role?: 'admin' | 'store_manager';
}

export class InventoryService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): InventoryService {
    return new InventoryService();
  }

  public async getStockLevels(params: GetStockLevelsParams = {}): Promise<PaginatedStockLevels> {
    try {
      const {
        page = 0,
        size = 20,
        city,
        bookTitle,
        availabilityStatus,
        role = 'store_manager'
      } = params;

      // Determine endpoint based on role
      const endpoint = role === 'admin' 
        ? '/admin/inventory/stock'
        : '/store-manager/inventory/stock';

      // Build query parameters
      const queryParams: Record<string, string | number> = {
        page,
        size,
      };

      // Add optional filters
      if (city) {
        queryParams.city = city;
      }
      if (bookTitle) {
        queryParams.bookTitle = bookTitle;
      }
      if (availabilityStatus && availabilityStatus !== 'all') {
        queryParams.availabilityStatus = availabilityStatus;
      }

      // Backend returns BaseResponse with data as a Map containing stockLevels and pagination
      const response = await this.apiFetcher.get<any>(endpoint, { 
        params: queryParams 
      });
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch stock levels');
      }

      // Extract data from the Map structure
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { stockLevels: [...], pagination: {...} } }
      return {
        stockLevels: data.stockLevels || [],
        pagination: data.pagination || { currentPage: 1, pageSize: 20, totalResults: 0, totalPages: 0 }
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch stock levels. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Adjust stock level with new quantity and reason
   * @param stockLevelId the stock level ID to adjust
   * @param request the adjustment request with newQuantity and reason
   * @param role user role to determine endpoint (admin or store_manager)
   * @returns updated stock level
   */
  public async adjustStock(
    stockLevelId: number, 
    request: StockAdjustmentRequest,
    role: 'admin' | 'store_manager' = 'store_manager'
  ): Promise<StockLevel> {
    try {
      // Determine endpoint based on role
      const endpoint = role === 'admin'
        ? `/admin/inventory/stock/${stockLevelId}/adjust`
        : `/store-manager/inventory/stock/${stockLevelId}/adjust`;

      // Backend returns BaseResponse with data as StockLevelDTO
      const response = await this.apiFetcher.put<any>(endpoint, request);
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to adjust stock');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to adjust stock. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get paginated audit log of stock adjustments for a stock level
   * @param stockLevelId the stock level ID
   * @param page page number (0-based)
   * @param size page size
   * @returns paginated list of adjustments
   */
  public async getStockAdjustments(
    stockLevelId: number,
    page: number = 0,
    size: number = 20
  ): Promise<PaginatedStockAdjustments> {
    try {
      const response = await this.apiFetcher.get<any>(
        `/store-manager/inventory/stock/${stockLevelId}/adjustments`,
        { params: { page, size } }
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch stock adjustments');
      }

      // Extract data from the Map structure
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { adjustments: [...], pagination: {...} } }
      return {
        adjustments: data.adjustments || [],
        pagination: data.pagination || { currentPage: 1, pageSize: 20, totalResults: 0, totalPages: 0 }
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch stock adjustments. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  // Legacy method - kept for backward compatibility
  public async adjustStockLegacy(stockId: number, data: AdjustStockRequest): Promise<StockLevel> {
    // Convert legacy format to new format
    // Note: This is a simplified conversion - legacy uses quantityChange, new uses newQuantity
    // This would need the current quantity to calculate newQuantity
    throw new Error('Legacy adjustStock method is deprecated. Use adjustStock with StockAdjustmentRequest instead.');
  }

  public async getStockByBook(bookId: number, city?: City): Promise<StockLevel> {
    try {
      const params = city ? { city } : {};
      const response = await this.apiFetcher.get<ApiResponse<StockLevel>>(
        `/store-manager/inventory/stock/book/${bookId}`,
        { params }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch stock for book');
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch stock for book. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}























