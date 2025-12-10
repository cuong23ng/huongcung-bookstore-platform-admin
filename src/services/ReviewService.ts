import { ApiClient } from '../integrations/ApiClient';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';
import type { Review } from '../models';

export class ReviewService {
  private static instance: ReviewService;
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  /**
   * Trigger AI review generation for a book
   * @param bookId The book ID to generate review for
   * @returns Promise with success message
   */
  public async generateAiReview(bookId: number): Promise<string> {
    try {
      const response = await this.apiFetcher.post<any>(
        `/reviews/generate-ai/${bookId}`
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to generate AI review');
      }

      // Extract message from BaseResponse
      const message = response.data.message || 'Yêu cầu tạo Review AI đã được tiếp nhận. Vui lòng kiểm tra lại sau 1-2 phút trong mục \'Duyệt bài\'.';
      return message;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to generate AI review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Get review for a book (OneToOne relationship)
   * @param bookId The book ID
   * @param status Optional status filter (DRAFT, PUBLISHED, REJECTED)
   * @returns Promise with review or null if not found
   */
  public async getReviewByBookId(bookId: number, status?: 'DRAFT' | 'PUBLISHED' | 'REJECTED'): Promise<Review | null> {
    try {
      const params = status ? { status } : {};
      const response = await this.apiFetcher.get<any>(
        `/reviews/book/${bookId}`,
        { params }
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch review');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        return null; // No review found
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        // If 404 or no data, return null
        if (error.response?.status === 404 || (error.response?.data as any)?.message?.includes("No review found")) {
          return null;
        }
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to fetch review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * @deprecated Use getReviewByBookId instead (OneToOne relationship)
   */
  public async getReviewsByBookId(bookId: number, status?: 'DRAFT' | 'PUBLISHED' | 'REJECTED'): Promise<Review[]> {
    const review = await this.getReviewByBookId(bookId, status);
    return review ? [review] : [];
  }

  /**
   * Create a manual review for a book
   */
  public async createReview(bookId: number, rating?: number, content?: string): Promise<Review> {
    try {
      const response = await this.apiFetcher.post<any>(
        `/reviews/book/${bookId}`,
        {
          bookId,
          rating,
          content,
          isAiGenerated: false,
        }
      );
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to create review');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to create review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Update an existing review for a book
   */
  public async updateReview(bookId: number, rating?: number, content?: string): Promise<Review> {
    try {
      const response = await this.apiFetcher.put<any>(
        `/reviews/book/${bookId}`,
        {
          rating,
          content,
        }
      );
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to update review');
      }

      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to update review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Enhance existing review using AI (improve, expand, or shorten)
   */
  public async enhanceReview(bookId: number, enhancementType: 'improve' | 'expand' | 'shorten' = 'improve', instructions?: string): Promise<string> {
    try {
      const response = await this.apiFetcher.post<any>(
        `/reviews/enhance-ai/${bookId}`,
        {
          enhancementType,
          instructions,
        }
      );
      
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to enhance review');
      }

      return response.data.message || 'Yêu cầu cải thiện Review AI đã được tiếp nhận. Vui lòng kiểm tra lại sau 1-2 phút.';
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to enhance review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Approve a review (change status to PUBLISHED)
   * @param reviewId The review ID
   * @returns Promise with updated review
   */
  public async approveReview(reviewId: number): Promise<Review> {
    try {
      const response = await this.apiFetcher.put<any>(
        `/reviews/${reviewId}/approve`
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to approve review');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to approve review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }

  /**
   * Reject a review (change status to REJECTED)
   * @param reviewId The review ID
   * @returns Promise with updated review
   */
  public async rejectReview(reviewId: number): Promise<Review> {
    try {
      const response = await this.apiFetcher.put<any>(
        `/reviews/${reviewId}/reject`
      );
      
      // Check if there's an error code (BaseResponse structure)
      if (response.data.errorCode) {
        throw new Error(response.data.message || 'Failed to reject review');
      }

      // Extract data from BaseResponse
      const data = response.data.data;
      if (!data) {
        throw new Error(response.data.message || 'No data returned from server');
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = 
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.message ||
          error.message ||
          'Failed to reject review. Please try again.';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

