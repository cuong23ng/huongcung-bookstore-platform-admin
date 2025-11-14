import { City } from './Staff';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ConsignmentStatus = 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

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
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  totalAmount: number;
  items: OrderItem[];
  shippingAddress?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderDetails extends Order {
  consignments?: Consignment[];
  shippingAddress: string;
  phone?: string;
  notes?: string;
}

export interface Consignment {
  id: number;
  orderId: number;
  warehouseCity: City;
  status: ConsignmentStatus;
  trackingNumber?: string;
  items: OrderItem[];
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



