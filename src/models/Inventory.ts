import { City } from './Staff';

export interface StockLevel {
  id: number;
  bookId: number;
  bookTitle?: string;
  bookCode?: string;
  bookIsbn?: string;
  sku?: string; // SKU from StockLevelDTO
  city: City; // Keep for backward compatibility, but prefer warehouseCity
  warehouseId?: number;
  warehouseCode?: string;
  warehouseCity?: string;
  warehouseAddress?: string;
  totalQuantity: number; // Maps to quantity (legacy)
  quantity?: number; // Backend field name (total stock)
  reservedQuantity: number; // Committed to orders (read-only)
  availableQuantity: number; // Calculated: quantity - reservedQuantity
  isLowStock?: boolean; // Calculated: quantity <= reorderLevel
  isOutOfStock?: boolean; // Calculated: availableQuantity <= 0
  status?: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'AVAILABLE'; // StockStatus from backend
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
  newQuantity: number; // New total quantity (not a change/delta)
  reason: string; // Required for audit logging (1-1000 characters)
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























