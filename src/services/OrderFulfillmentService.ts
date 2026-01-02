import { ApiClient } from '../integrations/ApiClient';
import type { Order, OrderDetails, Consignment, UpdateConsignmentRequest, City, FulfillmentQueueOrder, ConsignmentShipRequest, ConsignmentStatus, PaginatedConsignmentResponse } from '../models';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export class OrderFulfillmentService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): OrderFulfillmentService {
    return new OrderFulfillmentService();
  }

  /**
   * Get fulfillment queue with pagination
   * @param page Page number (0-indexed, default: 0)
   * @param size Page size (default: 20)
   * @param city Optional city filter
   * @param role Role to determine endpoint ('admin' or 'store_manager')
   * @returns Paginated orders response
   */
  public async getFulfillmentQueue(
    page: number = 0,
    size: number = 20,
    city?: City,
    role: 'admin' | 'store_manager' = 'store_manager'
  ): Promise<{ orders: Order[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } }> {
    try {
      // Determine endpoint based on role
      const endpoint = role === 'admin'
        ? '/admin/orders/fulfillment-queue'
        : '/store-manager/orders/fulfillment-queue';
      
      const params: any = { page, size };
      if (city) {
        params.city = city;
      }
      
      // Backend returns BaseResponse with data as a Map containing orders and pagination
      const response = await this.apiFetcher.get<any>(endpoint, { params });
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch fulfillment queue');
      }

      // Extract data from the Map structure
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { orders: [...], pagination: {...} } }
      // Map FulfillmentQueueOrder to Order format for frontend compatibility
      const fulfillmentOrders: FulfillmentQueueOrder[] = data.orders || [];
      const orders = fulfillmentOrders.map((fqOrder): Order => ({
        id: fqOrder.orderId,
        orderNumber: fqOrder.orderNumber,
        customerName: fqOrder.customerName,
        customerEmail: fqOrder.customerEmail,
        status: 'CONFIRMED' as const, // Fulfillment queue only contains CONFIRMED orders
        totalAmount: fqOrder.totalAmount,
        items: fqOrder.fulfillableItems.map(item => ({
          id: item.entryId,
          bookId: item.bookId,
          bookTitle: item.bookTitle,
          itemType: 'PHYSICAL' as const,
          quantity: item.requestedQuantity,
          unitPrice: item.unitPrice,
          subtotal: item.totalPrice,
        })),
        createdAt: fqOrder.orderDate,
      }));

      const pagination = data.pagination || {
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      };

      return {
        orders,
        pagination,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch fulfillment queue. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async createConsignments(orderId: number): Promise<Consignment[]> {
    try {
      // Backend returns BaseResponse with data as Consignment[]
      const response = await this.apiFetcher.post<any>(
        `/admin/orders/${orderId}/plan-fulfillment`,
        {}
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to create consignments');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to create consignments. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async updateConsignmentStatus(consignmentId: number, request: UpdateConsignmentRequest): Promise<Consignment> {
    try {
      // Backend returns BaseResponse with data as Consignment
      const response = await this.apiFetcher.put<any>(
        `/admin/consignments/${consignmentId}`,
        request
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to update consignment');
      }

      // Extract data from BaseResponse
      const responseData = response.data.data;
      if (!responseData) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return responseData;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to update consignment. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async getConsignmentsByOrder(orderId: number): Promise<Consignment[]> {
    try {
      // Backend returns BaseResponse with data as Consignment[]
      const response = await this.apiFetcher.get<any>(
        `/admin/orders/${orderId}/consignments`
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch consignments');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return Array.isArray(data) ? data : [];
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch consignments. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get consignments with pagination and filters
   * @param page Page number (0-indexed, default: 0)
   * @param size Page size (default: 20)
   * @param city Optional city filter
   * @param status Optional status filter (default: PENDING)
   * @param role Role to determine endpoint ('admin' or 'store_manager')
   * @returns Paginated consignment response
   */
  public async getConsignments(
    page: number = 0,
    size: number = 20,
    city?: City,
    status?: ConsignmentStatus,
    role: 'admin' | 'store_manager' = 'admin'
  ): Promise<PaginatedConsignmentResponse> {
    try {
      // Determine endpoint based on role
      const endpoint = role === 'admin'
        ? '/admin/orders/consignments'
        : '/store-manager/orders/consignments';
      
      const params: any = { page, size };
      if (city) {
        params.city = city;
      }
      if (status) {
        params.status = status;
      }
      
      // Backend returns BaseResponse with data as a Map containing consignments and pagination
      const response = await this.apiFetcher.get<any>(endpoint, { params });
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch consignments');
      }

      // Extract data from the Map structure
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { consignments: [...], pagination: {...} } }
      return {
        consignments: data.consignments || [],
        pagination: data.pagination || {
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
        },
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch consignments. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Ship a consignment (update status and commit stock)
   * @param consignmentId The consignment ID
   * @param request The ship request with status, tracking number, etc.
   * @param role Role to determine endpoint ('admin' or 'store_manager')
   * @returns Success message
   */
  public async shipConsignment(
    consignmentId: number,
    request: ConsignmentShipRequest,
    role: 'admin' | 'store_manager' = 'admin'
  ): Promise<void> {
    try {
      // Determine endpoint based on role
      const endpoint = role === 'admin'
        ? `/admin/orders/consignments/${consignmentId}/ship`
        : `/store-manager/orders/consignments/${consignmentId}/ship`;
      
      // Backend returns BaseResponse
      const response = await this.apiFetcher.put<any>(endpoint, request);
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to ship consignment');
      }

      // Success - no data returned, just message
      return;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to ship consignment. Please check your input and try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get all orders with pagination and filters (for admin)
   * @param page Page number (0-indexed, default: 0)
   * @param size Page size (default: 20)
   * @param status Optional status filter
   * @param city Optional city filter
   * @returns Paginated orders response
   */
  public async getOrders(
    page: number = 0,
    size: number = 20,
    status?: string,
    city?: City
  ): Promise<{ orders: Order[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } }> {
    try {
      const params: any = { page, size };
      if (status) {
        params.status = status;
      }
      if (city) {
        params.city = city;
      }
      
      const response = await this.apiFetcher.get<any>('/admin/orders', { params });
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { orders: [...], pagination: {...} } }
      const orders = data.orders || [];
      const pagination = data.pagination || {
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
      };

      return {
        orders: orders,
        pagination: pagination,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch orders. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get order details by ID
   * @param orderId The order ID
   * @returns Order details
   */
  public async getOrderDetails(orderId: number): Promise<OrderDetails> {
    try {
      const response = await this.apiFetcher.get<any>(`/admin/orders/${orderId}`);
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch order details');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { order: {...} } }
      return data.order || data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch order details. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Create shipping order for a consignment
   * @param consignmentId The consignment ID
   * @returns Tracking number from GHN
   */
  public async createShippingOrderForConsignment(consignmentId: number): Promise<string> {
    try {
      const response = await this.apiFetcher.post<any>(`/admin/orders/consignments/${consignmentId}/create-shipping-order`);
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to create shipping order');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns: { data: { trackingNumber: "..." } }
      return data.trackingNumber || '';
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
}























