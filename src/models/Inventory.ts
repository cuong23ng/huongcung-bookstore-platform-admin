import { City } from './Staff';

export type StockStatus = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'AVAILABLE';

export interface StockLevel {
  id: number;
  bookId: number;
  bookTitle?: string;
  bookCode?: string;
  isbn?: string;
  sku?: string;
  city: City;
  warehouseId?: number;
  warehouseCode?: string;
  warehouseCity?: string;
  warehouseAddress?: string;
  totalQuantity: number;
  quantity?: number;
  reservedQuantity: number;
  availableQuantity: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  status?: StockStatus;
  reorderLevel?: number;
  reorderQuantity?: number;
  lastRestocked?: string;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedStockLevels {
  stockLevels: StockLevel[];
  pagination: {
    currentPage: number; // 1-based
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

export interface StockAdjustmentRequest {
  newQuantity: number;
  reason: string;
}

export interface StockAdjustment {
  id: number;
  stockLevelId: number;
  previousQuantity: number;
  newQuantity: number;
  difference: number; // newQuantity - previousQuantity
  reason: string;
  adjustedBy: number; // User ID
  adjustedByEmail?: string; // Optional: email of the user who made the adjustment
  adjustedAt: string;
  createdAt?: string;
}

export interface PaginatedStockAdjustments {
  adjustments: StockAdjustment[];
  pagination: {
    currentPage: number; // 1-based
    pageSize: number;
    totalResults: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrevious?: boolean;
  };
}

// Legacy interface - kept for backward compatibility
export interface AdjustStockRequest {
  quantityChange: number; // Can be positive or negative
  reason: string; // Required for audit logging
}

export type AvailabilityStatus = 'low_stock' | 'out_of_stock' | 'available' | 'all';























