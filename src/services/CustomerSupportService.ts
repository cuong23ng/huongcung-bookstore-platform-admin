import { ApiClient } from '../integrations/ApiClient';
import { Customer, PaginatedOrders, OrderDetails, ApiResponse } from '../models';
import { AxiosInstance, AxiosError } from 'axios';

export class CustomerSupportService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): CustomerSupportService {
    return new CustomerSupportService();
  }

  public async lookupCustomer(query: { email?: string; phone?: string }): Promise<Customer> {
    try {
      const params: { email?: string; phone?: string } = {};
      if (query.email) params.email = query.email;
      if (query.phone) params.phone = query.phone;

      const response = await this.apiFetcher.get<ApiResponse<Customer>>(
        '/support/customers/lookup',
        { params }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Customer not found');
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 404) {
          throw new Error('Customer not found');
        }
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to lookup customer. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async getCustomerOrders(customerId: number, page: number = 1): Promise<PaginatedOrders> {
    try {
      const response = await this.apiFetcher.get<ApiResponse<PaginatedOrders>>(
        `/support/customers/${customerId}/orders`,
        { params: { page } }
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch customer orders');
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch customer orders. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  public async getOrderDetails(orderId: number): Promise<OrderDetails> {
    try {
      const response = await this.apiFetcher.get<ApiResponse<OrderDetails>>(
        `/support/orders/${orderId}`
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch order details');
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

  public async cancelOrder(orderId: number, reason?: string): Promise<void> {
    try {
      const response = await this.apiFetcher.post<ApiResponse<null>>(
        `/support/orders/${orderId}/cancel`,
        { reason }
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to cancel order');
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        if (status === 400) {
          throw new Error('Order cannot be cancelled (already shipped or delivered)');
        }
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to cancel order. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}



