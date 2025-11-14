import { City } from './Staff';

export interface StockLevel {
  id: number;
  bookId: number;
  bookTitle?: string;
  city: City;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lastUpdated?: string;
}

export interface AdjustStockRequest {
  quantityChange: number; // Can be positive or negative
  reason: string; // Required for audit logging
}



