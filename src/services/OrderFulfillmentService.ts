import { ApiClient } from '../integrations/ApiClient';
import type { Order, Consignment, UpdateConsignmentRequest, City, FulfillmentQueueOrder } from '../models';
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

  public async getFulfillmentQueue(city?: City, role: 'admin' | 'store_manager' = 'store_manager'): Promise<Order[]> {
    try {
      // Determine endpoint based on role
      const endpoint = role === 'admin'
        ? '/admin/orders/fulfillment-queue'
        : '/store-manager/orders/fulfillment-queue';
      
      const params = city ? { city } : {};
      
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
      return fulfillmentOrders.map((fqOrder): Order => ({
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
        `/store-manager/consignments/${consignmentId}`,
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
        `/store-manager/orders/${orderId}/consignments`
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
}























