import { ApiClient } from '../integrations/ApiClient';
import { Order, Consignment, CreateConsignmentRequest, UpdateConsignmentRequest, ApiResponse, City } from '../models';
import { AxiosInstance, AxiosError } from 'axios';

export class OrderFulfillmentService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): OrderFulfillmentService {
    return new OrderFulfillmentService();
  }

  public async getFulfillmentQueue(city?: City): Promise<Order[]> {
    try {
      const params = city ? { city } : {};
      const response = await this.apiFetcher.get<ApiResponse<Order[]>>(
        '/store-manager/orders/fulfillment-queue',
        { params }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch fulfillment queue');
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
      const response = await this.apiFetcher.post<ApiResponse<Consignment[]>>(
        `/store-manager/orders/${orderId}/consignments`,
        {}
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create consignments');
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

  public async updateConsignmentStatus(consignmentId: number, data: UpdateConsignmentRequest): Promise<Consignment> {
    try {
      const response = await this.apiFetcher.put<ApiResponse<Consignment>>(
        `/store-manager/consignments/${consignmentId}`,
        data
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update consignment');
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
      const response = await this.apiFetcher.get<ApiResponse<Consignment[]>>(
        `/store-manager/orders/${orderId}/consignments`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch consignments');
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



