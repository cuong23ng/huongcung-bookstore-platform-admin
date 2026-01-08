import { ApiClient } from '../integrations/ApiClient';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export interface RevenueDataPoint {
  date: string;
  amount: number;
}

export interface TopSellingBook {
  bookId: number;
  bookTitle: string;
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
}

export interface OrderTrendDataPoint {
  date: string;
  count: number;
}

export interface DashboardStatistics {
  revenueTrend: RevenueDataPoint[];
  orderStatusCounts: Record<string, number>;
  topSellingBooks: TopSellingBook[];
  orderTrend: OrderTrendDataPoint[];
}

export class DashboardService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): DashboardService {
    return new DashboardService();
  }

  /**
   * Get dashboard statistics including revenue trend and order status counts
   * @returns Dashboard statistics data
   */
  public async getDashboardStatistics(): Promise<DashboardStatistics> {
    try {
      const response = await this.apiFetcher.get<{ data: DashboardStatistics }>(
        '/admin/order/dashboard/statistics'
      );

      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch dashboard statistics');
      }

      const statistics = response.data.data;
      if (!statistics) {
        throw new Error('No data returned from server');
      }

      // Convert BigDecimal amounts to numbers
      const revenueTrend = statistics.revenueTrend.map(point => ({
        date: point.date,
        amount: typeof point.amount === 'number' ? point.amount : parseFloat(point.amount.toString()),
      }));

      // Convert Long counts to numbers
      const orderStatusCounts: Record<string, number> = {};
      Object.entries(statistics.orderStatusCounts).forEach(([status, count]) => {
        orderStatusCounts[status] = typeof count === 'number' ? count : parseInt(count.toString(), 10);
      });

      // Convert top selling books
      const topSellingBooks = (statistics.topSellingBooks || []).map(book => ({
        bookId: typeof book.bookId === 'number' ? book.bookId : parseInt(book.bookId?.toString() || '0', 10),
        bookTitle: book.bookTitle || 'Unknown',
        sku: book.sku || '',
        totalQuantity: typeof book.totalQuantity === 'number' ? book.totalQuantity : parseInt(book.totalQuantity?.toString() || '0', 10),
        totalRevenue: typeof book.totalRevenue === 'number' ? book.totalRevenue : parseFloat(book.totalRevenue?.toString() || '0'),
      }));

      // Convert order trend
      const orderTrend = (statistics.orderTrend || []).map(point => ({
        date: point.date,
        count: typeof point.count === 'number' ? point.count : parseInt(point.count?.toString() || '0', 10),
      }));

      return {
        revenueTrend,
        orderStatusCounts,
        topSellingBooks,
        orderTrend,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage =
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch dashboard statistics. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

