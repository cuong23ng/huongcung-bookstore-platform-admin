import { City } from './Staff';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ConsignmentStatus = 'CREATED' | 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'FAILED_DELIVERY' | 'RETURNED';

export interface OrderItem {
  id: number;
  bookId: number;
  bookTitle: string;
  itemType: 'PHYSICAL' | 'EBOOK';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'PAID' | 'REFUNDED';
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

// DTO from backend fulfillment queue endpoint
export interface FulfillmentQueueOrder {
  orderId: number;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  orderDate: string; // LocalDateTime from backend
  totalAmount: number;
  itemCount: number;
  fulfillableItemCount: number;
  fulfillableItems: FulfillableItem[];
}

export interface FulfillableItem {
  entryId: number;
  bookId: number;
  bookTitle: string;
  bookCode?: string;
  requestedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  name?: string;
  phone?: string;
  address?: string;
  province?: {
    provinceId?: string;
    provinceName?: string;
  };
  district?: {
    districtId?: string;
    districtName?: string;
  };
  ward?: {
    wardCode?: string;
    wardName?: string;
  };
  postalCode?: string;
}

export interface OrderDetails extends Order {
  consignments?: Consignment[];
  shippingAddress?: Address | string; // Can be Address object or string (for backward compatibility)
  phone?: string;
  notes?: string;
  subtotal?: number;
  shippingAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod?: string;
  orderType?: string;
  billingAddress?: string;
}

export interface ConsignmentEntry {
  id: number;
  orderEntryId: number;
  bookId: number;
  bookTitle: string;
  bookCode?: string;
  quantity: number;
  shippedQuantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Consignment {
  id: number;
  code: string;
  orderId: number;
  orderNumber: string;
  status: ConsignmentStatus;
  trackingNumber?: string;
  shippingCompany?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  shippingAddress?: string;
  notes?: string;
  totalPrice: number;
  codAmount: number;
  warehouseCity: City;
  warehouseId: number;
  warehouseCode?: string;
  customerName?: string;
  customerEmail?: string;
  entries: ConsignmentEntry[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateConsignmentRequest {
  // Backend handles consignment splitting algorithm
  // This is just a trigger, no request body needed
}

export interface UpdateConsignmentRequest {
  status: ConsignmentStatus;
  trackingNumber?: string;
}

export interface ConsignmentShipRequest {
  status: 'PICKED_UP' | 'IN_TRANSIT';
  trackingNumber?: string;
  shippingCompany?: string;
  estimatedDeliveryDate?: string;
}

export interface PaginatedConsignmentResponse {
  consignments: Consignment[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}























