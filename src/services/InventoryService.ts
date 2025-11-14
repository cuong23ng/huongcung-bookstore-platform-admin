import { ApiClient } from '../integrations/ApiClient';
import { StockLevel, AdjustStockRequest, ApiResponse, City } from '../models';
import { AxiosInstance, AxiosError } from 'axios';

export class InventoryService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): InventoryService {
    return new InventoryService();
  }

  public async getStockLevels(city?: City): Promise<StockLevel[]> {
    try {
      const params = city ? { city } : {};
      const response = await this.apiFetcher.get<ApiResponse<StockLevel[]>>('/store-manager/inventory/stock', { params });
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch stock levels');
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

  public async adjustStock(stockId: number, data: AdjustStockRequest): Promise<StockLevel> {
    try {
      const response = await this.apiFetcher.put<ApiResponse<StockLevel>>(
        `/store-manager/inventory/stock/${stockId}/adjust`,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to adjust stock');
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



