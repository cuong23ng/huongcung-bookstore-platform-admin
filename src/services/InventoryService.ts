import { ApiClient } from '../integrations/ApiClient';
import type { 
  StockLevel, 
  AdjustStockRequest, 
  StockAdjustmentRequest,
  PaginatedStockAdjustments,
  ApiResponse,
  PaginatedStockLevels, 
  AvailabilityStatus,
  SaleOrderStatus,
  PaginatedSaleOrdersResponse,
  SaleOrder,
} from '../models';
import type { City } from '../enum/Common';
import type { StaffRole } from '../models/Staff';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export interface GetStockLevelsParams {
  page?: number;
  size?: number;
  city?: City;
  q?: string; // Search query
  searchBy?: 'TITLE' | 'SKU' | 'ISBN'; // Search type, default 'TITLE'
  warehouseCode?: string; // Warehouse code filter
  status?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'AVAILABLE'; // Status filter
  role?: 'admin' | 'store_manager';
}

export interface GetSaleOrdersParams {
  page?: number;
  size?: number;
  code?: string;
  city?: City;
  warehouse?: string;
  status?: SaleOrderStatus;
  startTime?: string;
  endTime?: string;
  sort?: string;
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
        q,
        searchBy = 'TITLE',
        warehouseCode,
        status,
        role = 'ROLE_STORE_MANAGER' as StaffRole
      } = params;

      const endpoint = '/admin/inventory/stock';

      const queryParams: Record<string, string | number> = {
        page,
        size,
      };

      // Add optional filters
      if (q) {
        queryParams.q = q;
      }
      if (searchBy) {
        queryParams.searchBy = searchBy;
      }
      if (city) {
        queryParams.city = city;
      }
      if (warehouseCode) {
        queryParams.warehouseCode = warehouseCode;
      }
      if (status) {
        queryParams.status = status;
      }

      const response = await this.apiFetcher.get<any>(endpoint, { 
        params: queryParams 
      });
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch stock levels');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

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

  public async adjustStock(
    stockLevelId: number, 
    request: StockAdjustmentRequest,
    role: StaffRole = 'ROLE_STORE_MANAGER'
  ): Promise<string> {
    try {
      const endpoint = `/admin/inventory/stock/${stockLevelId}/adjust`;
      const response = await this.apiFetcher.put<any>(endpoint, request);
      return response.data.message;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          error.response?.data.message ||
          error.message ||
          'Failed to adjust stock. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async getStockLevelById(id: number): Promise<StockLevel> {
    try {
      const endpoint = `/admin/inventory/stock/${id}`;

      const response = await this.apiFetcher.get<any>(endpoint);
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch stock level details');
      }

      // Extract data from BaseResponse -> StockLevelDTO structure
      const stockLevelData = response.data.data;
      if (!stockLevelData) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return stockLevelData;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch stock level details. Please try again.';
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
        `/admin/inventory/stock/${stockLevelId}/adjustments`,
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

  /**
   * Get paginated sale orders with filters
   * @param params Filter parameters including code, city, warehouse, status, and date range
   * @returns Paginated sale orders response
   */
  public async getSaleOrders(params: GetSaleOrdersParams = {}): Promise<PaginatedSaleOrdersResponse> {
    try {
      const {
        page = 0,
        size = 20,
        code,
        city,
        warehouse,
        status,
        startTime,
        endTime,
        sort
      } = params;

      const endpoint = '/admin/inventory/sale-order';

      // Build query parameters
      const queryParams: Record<string, string | number> = {
        page,
        size,
      };

      // Add optional filters
      if (code && code.trim()) {
        queryParams.code = code.trim();
      }
      if (city) {
        queryParams.city = city;
      }
      if (warehouse) {
        queryParams.warehouse = warehouse;
      }
      if (status) {
        queryParams.status = status;
      }
      if (startTime) {
        queryParams.startTime = startTime;
      }
      if (endTime) {
        queryParams.endTime = endTime;
      }
      if (sort) {
        queryParams.sort = sort;
      }

      // Backend returns BaseResponse with data as SearchResponse
      const response = await this.apiFetcher.get<any>(endpoint, { 
        params: queryParams 
      });
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch sale orders');
      }

      // Extract data from BaseResponse -> SearchResponse structure
      const searchResponse = response.data.data;
      if (!searchResponse) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Map backend SearchResponse to frontend format
      // Backend: { data: SaleOrderDTO[], pagination: PaginationInfo }
      // Frontend: { saleOrders: SaleOrder[], pagination: { page, size, totalElements, totalPages } }
      const backendData = searchResponse.data || [];
      const backendPagination = searchResponse.pagination || {};

      return {
        saleOrders: backendData,
        pagination: {
          page: (backendPagination.currentPage || 1) - 1, // Convert 1-based to 0-based
          size: backendPagination.pageSize || size,
          totalElements: backendPagination.totalResults || 0,
          totalPages: backendPagination.totalPages || 0
        }
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch sale orders. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Create shipping order for a sale order
   * @param saleOrderId The sale order ID
   * @returns Tracking number (orderCode) from shipping service
   */
  public async createShippingOrder(saleOrderId: number): Promise<string> {
    try {
      const endpoint = `/admin/inventory/sale-order/${saleOrderId}/create-shipping-order`;

      const response = await this.apiFetcher.post<any>(endpoint);

      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to create shipping order');
      }

      // Extract data from BaseResponse -> ShippingOrderDTO structure
      const shippingOrderData = response.data.data;
      if (!shippingOrderData) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // ShippingOrderDTO contains: orderCode, expectedDeliveryTime, totalFee
      // Return orderCode as tracking number
      return shippingOrderData.orderCode || '';
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to create shipping order. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get sale order details by ID
   * @param saleOrderId The sale order ID
   * @returns Sale order details with book information
   */
  public async getSaleOrderById(saleOrderId: number): Promise<SaleOrder> {
    try {
      const endpoint = `/admin/inventory/sale-order/${saleOrderId}`;

      const response = await this.apiFetcher.get<any>(endpoint);

      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch sale order details');
      }

      // Extract data from BaseResponse -> SaleOrderDTO structure
      const saleOrderData = response.data.data;
      if (!saleOrderData) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return saleOrderData;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch sale order details. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Ship a sale order (update status)
   * @param saleOrderId The sale order ID
   * @param status The new status (PICKED_UP or IN_TRANSIT)
   * @returns Success message
   */
  public async shipSaleOrder(saleOrderId: number, status: SaleOrderStatus): Promise<void> {
    try {
      const endpoint = `/admin/inventory/sale-order/${saleOrderId}/ship`;

      // Pass status as query parameter
      const response = await this.apiFetcher.put<any>(endpoint, null, {
        params: { status }
      });

      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to ship sale order');
      }

      // Success - no data returned, just message
      return;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to ship sale order. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}























