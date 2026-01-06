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
   * @param sort Sort order: "createdAt,desc" (newest) or "createdAt,asc" (oldest), default: "createdAt,desc"
   * @returns Paginated orders response
   */
  public async getFulfillmentQueue(
    page: number = 0,
    size: number = 20,
    sort: string = "createdAt,desc"
  ): Promise<{ orders: Order[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } }> {
    try {
      const endpoint = '/admin/order';
      
      const params: any = { 
        page, 
        size, 
        status: 'CONFIRMED',
        sort 
      };
      

      const response = await this.apiFetcher.get<any>(endpoint, { params });
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch fulfillment queue');
      }

      const searchResponse = response.data.data;
      if (!searchResponse) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      const pageData = searchResponse.data || {};
      const orderListDTOs: any[] = pageData.content || [];
      const paginationInfo = searchResponse.pagination || {};

      // Map OrderListDTO to Order format
      const orders = orderListDTOs.map((dto): Order => ({
        id: dto.id,
        orderNumber: dto.orderNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        status: dto.status || 'CONFIRMED',
        totalAmount: dto.totalAmount || 0,
        items: [], // OrderListDTO doesn't include items
        createdAt: dto.createdAt,
      }));

      const pagination = {
        page: paginationInfo.currentPage !== undefined ? paginationInfo.currentPage : 0,
        size: paginationInfo.pageSize || 20,
        totalElements: paginationInfo.totalResults || 0,
        totalPages: paginationInfo.totalPages || 0,
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
      // Backend returns BaseResponse with message (no data field)
      const response = await this.apiFetcher.post<any>(
        `/admin/order/${orderId}/allocation/approve`,
        {}
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to create consignments');
      }

      // API returns 201 CREATED with message, no data field
      // Return empty array since consignments are not returned in response
      return [];
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
   * @param orderNumber Optional order number filter
   * @param customer Optional customer filter (searches name or email)
   * @param startTime Optional start time filter (format: "yyyy-MM-dd HH:mm:ss")
   * @param endTime Optional end time filter (format: "yyyy-MM-dd HH:mm:ss")
   * @param sort Sort order: "createdAt,desc" (newest) or "createdAt,asc" (oldest), default: "createdAt,desc"
   * @returns Paginated orders response
   */
  public async getOrders(
    page: number = 0,
    size: number = 20,
    status?: string,
    orderNumber?: string,
    customer?: string,
    startTime?: string,
    endTime?: string,
    sort: string = "createdAt,desc"
  ): Promise<{ orders: Order[]; pagination: { page: number; size: number; totalElements: number; totalPages: number } }> {
    try {
      const params: any = { page, size, sort };
      if (status) {
        params.status = status;
      }
      if (orderNumber) {
        params.orderNumber = orderNumber;
      }
      if (customer) {
        params.customer = customer;
      }
      if (startTime) {
        params.startTime = startTime;
      }
      if (endTime) {
        params.endTime = endTime;
      }
      
      const response = await this.apiFetcher.get<any>('/admin/order', { params });
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }

      // Extract data from SearchResponse structure
      const searchResponse = response.data.data;
      if (!searchResponse) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      const pageData = searchResponse.data || {};
      const orderListDTOs: any[] = pageData.content || [];
      const paginationInfo = searchResponse.pagination || {};

      // Map OrderListDTO to Order format
      const orders = orderListDTOs.map((dto): Order => ({
        id: dto.id,
        orderNumber: dto.orderNumber,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail,
        status: dto.status,
        totalAmount: dto.totalAmount || 0,
        items: [], // OrderListDTO doesn't include items
        createdAt: dto.createdAt,
      }));

      const pagination = {
        page: paginationInfo.currentPage !== undefined ? paginationInfo.currentPage : 0,
        size: paginationInfo.pageSize || 20,
        totalElements: paginationInfo.totalResults || 0,
        totalPages: paginationInfo.totalPages || 0,
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
      const response = await this.apiFetcher.get<any>(`/admin/order/${orderId}`);
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch order details');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      // Backend returns OrderDetailsDTO directly in data field
      // Map OrderDetailsDTO to OrderDetails interface
      const orderDetails: OrderDetails = {
        id: data.id,
        orderNumber: data.orderNumber,
        status: data.status,
        paymentMethod: data.paymentMethod,
        orderType: data.orderType,
        totalAmount: data.totalAmount ? Number(data.totalAmount) : 0,
        subtotal: data.subtotal ? Number(data.subtotal) : 0,
        shippingAmount: data.shippingAmount ? Number(data.shippingAmount) : 0,
        taxAmount: data.taxAmount ? Number(data.taxAmount) : 0,
        discountAmount: data.discountAmount ? Number(data.discountAmount) : 0,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        notes: data.notes,
        // Map shippingAddress from AddressDTO
        shippingAddress: data.shippingAddress ? {
          name: data.shippingAddress.name,
          phone: data.shippingAddress.phone,
          address: data.shippingAddress.address,
          province: data.shippingAddress.province ? {
            provinceId: data.shippingAddress.province.provinceId,
            provinceName: data.shippingAddress.province.provinceName,
          } : undefined,
          district: data.shippingAddress.district ? {
            districtId: data.shippingAddress.district.districtId,
            districtName: data.shippingAddress.district.districtName,
          } : undefined,
          ward: data.shippingAddress.ward ? {
            wardCode: data.shippingAddress.ward.wardCode,
            wardName: data.shippingAddress.ward.wardName,
          } : undefined,
          postalCode: data.shippingAddress.postalCode,
        } : undefined,
        // Map items from OrderDetailsItemDTO[]
        items: data.items ? data.items.map((item: any) => ({
          id: item.id,
          bookId: 0, // bookId not available in OrderDetailsItemDTO, using 0 as placeholder
          bookTitle: item.bookTitle || '',
          itemType: item.itemType || 'PHYSICAL',
          quantity: item.quantity || 0,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
          subtotal: item.totalPrice ? Number(item.totalPrice) : 0, // Backend uses totalPrice
        })) : [],
        // Keep consignments and deliveryInfo as undefined since they're commented in backend
        consignments: undefined,
      };

      return orderDetails;
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























