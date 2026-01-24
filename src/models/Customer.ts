import { Order, OrderDetails } from './Order';
import { PaginationInfo } from './PaginationInfo';

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  loyaltyTier: LoyaltyTier;
  pointsBalance?: number;
  createdAt?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  pagination: PaginationInfo;
}























