import { ApiClient } from '../integrations/ApiClient';
import type { 
  Book, CreateBookRequest, UpdateBookRequest,
  Author, CreateAuthorRequest, UpdateAuthorRequest,
  Translator, CreateTranslatorRequest, UpdateTranslatorRequest,
  Publisher, CreatePublisherRequest, UpdatePublisherRequest,
  Genre, CreateGenreRequest, UpdateGenreRequest,
  BaseResponse,
  GetBookCatalogPageResponse,
  GetAuthorPageResponse,
  GetGenrePageResponse,
  GetPublisherPageResponse,
  GetTranslatorPageResponse,
  BookDetail
} from '../models';
import type { AxiosInstance } from 'axios';
import { AxiosError } from 'axios';

export class CatalogService {
  private readonly apiFetcher: AxiosInstance;

  private constructor() {
    this.apiFetcher = ApiClient.create();
  }

  public static getInstance(): CatalogService {
    return new CatalogService();
  }

  // Books
  public async getAllBooks(): Promise<Book[]> {
    try {
      // Backend returns: { data: { books: [...], pagination: {...} }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<BaseResponse<GetBookCatalogPageResponse>>('/admin/catalog/books');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch books');
      }
      
      // Backend returns data in format: { data: { books: [...], pagination: {...} } }
      if (response.data?.data) {
        // Check if data is an object with 'books' property (paginated response)
        if (typeof response.data.data === 'object' && 'books' in response.data.data) {
          return response.data.data.books || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        if (Array.isArray(response.data.data)) {
        return response.data.data;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch books');
    }
  }

  public async createBook(data: CreateBookRequest): Promise<Book> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<Book>>('/admin/catalog/books/create', data);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create book');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create book');
    } catch (error) {
      throw this.handleError(error, 'Failed to create book');
    }
  }

  public async updateBook(id: number, data: UpdateBookRequest): Promise<Book> {
    try {
      const response = await this.apiFetcher.put<BaseResponse<Book>>(`/admin/catalog/books/${id}`, data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update book');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update book');
    } catch (error) {
      throw this.handleError(error, 'Failed to update book');
    }
  }

  public async getBookById(id: number): Promise<BookDetail> {
    try {
      const response = await this.apiFetcher.get<BaseResponse<BookDetail>>(`/admin/catalog/books/${id}`);
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch book');
      }
      
      // Backend returns data in format: { data: BookDetailDTO }
      if (response.data?.data) {
        return response.data.data;
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch book');
    }
  }

  public async deleteBook(id: number): Promise<void> {
    try {
      // Backend returns: { data: null, message?: string, errorCode?: string }
      const response = await this.apiFetcher.delete<BaseResponse<null>>(`/admin/catalog/books/${id}`);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete book');
      }
      // If no errorCode, deletion was successful
    } catch (error) {
      throw this.handleError(error, 'Failed to delete book');
    }
  }

  public async uploadBookImages(id: number, files: File[]): Promise<void> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const response = await this.apiFetcher.post<BaseResponse<null>>(
        `/admin/catalog/books/${id}/images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to upload images');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to upload images');
    }
  }

  public async deleteBookImage(bookId: number, imageId: number): Promise<void> {
    try {
      const response = await this.apiFetcher.delete<BaseResponse<null>>(
        `/admin/catalog/books/${bookId}/images/${imageId}`
      );

      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete image');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to delete image');
    }
  }

  public async createOrUpdatePhysicalBook(id: number, data: {
    isbn?: string;
    coverType?: string;
    publicationDate?: string;
    weightGrams?: number;
    heightCm?: number;
    widthCm?: number;
    lengthCm?: number;
    currentPrice?: number;
  }): Promise<void> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<null>>(
        `/admin/catalog/books/${id}/create-update/physical`,
        data
      );

      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create/update physical book');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to create/update physical book');
    }
  }

  public async createOrUpdateEbook(id: number, data: {
    isbn: string;
    publicationDate?: string;
    currentPrice: number;
  }): Promise<void> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<null>>(
        `/admin/catalog/books/${id}/create-update/ebook`,
        data
      );

      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create/update ebook');
      }
    } catch (error) {
      throw this.handleError(error, 'Failed to create/update ebook');
    }
  }

  // Authors
  public async getAllAuthors(): Promise<Author[]> {
    try {
      // Backend returns: { data: { authors: [...], pagination: {...} } or { data: [...] }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<BaseResponse<GetAuthorPageResponse | Author[]>>('/admin/catalog/authors');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch authors');
      }
      
      // Backend returns data in format: { data: { authors: [...], pagination: {...} } } or { data: [...] }
      if (response.data?.data) {
        // Check if data is an object with 'authors' property (paginated response)
        if (typeof response.data.data === 'object' && 'authors' in response.data.data) {
          return (response.data.data as GetAuthorPageResponse).authors || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch authors');
    }
  }

  public async createAuthor(data: CreateAuthorRequest): Promise<Author> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<Author>>('/admin/catalog/authors', data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create author');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create author');
    } catch (error) {
      throw this.handleError(error, 'Failed to create author');
    }
  }

  public async updateAuthor(id: number, data: UpdateAuthorRequest): Promise<Author> {
    try {
      const response = await this.apiFetcher.put<BaseResponse<Author>>(`/admin/catalog/authors/${id}`, data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update author');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update author');
    } catch (error) {
      throw this.handleError(error, 'Failed to update author');
    }
  }

  public async deleteAuthor(id: number): Promise<void> {
    try {
      // Backend returns: { data: null, message?: string, errorCode?: string }
      const response = await this.apiFetcher.delete<BaseResponse<null>>(`/admin/catalog/authors/${id}`);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete author');
      }
      // If no errorCode, deletion was successful
    } catch (error) {
      throw this.handleError(error, 'Failed to delete author');
    }
  }

  // Translators
  public async getAllTranslators(): Promise<Translator[]> {
    try {
      // Backend returns: { data: { translators: [...], pagination: {...} } or { data: [...] }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<BaseResponse<GetTranslatorPageResponse | Translator[]>>('/admin/catalog/translators');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch translators');
      }
      
      // Backend returns data in format: { data: { translators: [...], pagination: {...} } } or { data: [...] }
      if (response.data?.data) {
        // Check if data is an object with 'translators' property (paginated response)
        if (typeof response.data.data === 'object' && 'translators' in response.data.data) {
          return (response.data.data as GetTranslatorPageResponse).translators || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch translators');
    }
  }

  public async createTranslator(data: CreateTranslatorRequest): Promise<Translator> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<Translator>>('/admin/catalog/translators', data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create translator');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create translator');
    } catch (error) {
      throw this.handleError(error, 'Failed to create translator');
    }
  }

  public async updateTranslator(id: number, data: UpdateTranslatorRequest): Promise<Translator> {
    try {
      const response = await this.apiFetcher.put<BaseResponse<Translator>>(`/admin/catalog/translators/${id}`, data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update translator');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update translator');
    } catch (error) {
      throw this.handleError(error, 'Failed to update translator');
    }
  }

  public async deleteTranslator(id: number): Promise<void> {
    try {
      const response = await this.apiFetcher.delete<BaseResponse<null>>(`/admin/catalog/translators/${id}`);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete translator');
      }
      // If no errorCode, deletion was successful
    } catch (error) {
      throw this.handleError(error, 'Failed to delete translator');
    }
  }

  // Publishers
  public async getAllPublishers(): Promise<Publisher[]> {
    try {
      // Backend returns: { data: { publishers: [...], pagination: {...} } or { data: [...] }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<BaseResponse<GetPublisherPageResponse | Publisher[]>>('/admin/catalog/publishers');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch publishers');
      }
      
      // Backend returns data in format: { data: { publishers: [...], pagination: {...} } } or { data: [...] }
      if (response.data?.data) {
        // Check if data is an object with 'publishers' property (paginated response)
        if (typeof response.data.data === 'object' && 'publishers' in response.data.data) {
          return (response.data.data as GetPublisherPageResponse).publishers || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch publishers');
    }
  }

  public async createPublisher(data: CreatePublisherRequest): Promise<Publisher> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<Publisher>>('/admin/catalog/publishers', data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create publisher');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create publisher');
    } catch (error) {
      throw this.handleError(error, 'Failed to create publisher');
    }
  }

  public async updatePublisher(id: number, data: UpdatePublisherRequest): Promise<Publisher> {
    try {
      const response = await this.apiFetcher.put<BaseResponse<Publisher>>(`/admin/catalog/publishers/${id}`, data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update publisher');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update publisher');
    } catch (error) {
      throw this.handleError(error, 'Failed to update publisher');
    }
  }

  public async deletePublisher(id: number): Promise<void> {
    try {
      const response = await this.apiFetcher.delete<BaseResponse<null>>(`/admin/catalog/publishers/${id}`);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete publisher');
      }
      // If no errorCode, deletion was successful
    } catch (error) {
      throw this.handleError(error, 'Failed to delete publisher');
    }
  }

  // Genres
  public async getAllGenres(): Promise<Genre[]> {
    try {
      // Backend returns: { data: { genres: [...], pagination: {...} } or { data: [...] }, message?: string, errorCode?: string }
      const response = await this.apiFetcher.get<BaseResponse<GetGenrePageResponse | Genre[]>>('/admin/catalog/genres');
      
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to fetch genres');
      }
      
      // Backend returns data in format: { data: { genres: [...], pagination: {...} } } or { data: [...] }
      if (response.data?.data) {
        // Check if data is an object with 'genres' property (paginated response)
        if (typeof response.data.data === 'object' && 'genres' in response.data.data) {
          return (response.data.data as GetGenrePageResponse).genres || [];
        }
        // Otherwise, data might be directly the array (fallback for non-paginated)
        if (Array.isArray(response.data.data)) {
          return response.data.data;
        }
      }
      
      throw new Error('Invalid response format from server');
    } catch (error) {
      throw this.handleError(error, 'Failed to fetch genres');
    }
  }

  public async createGenre(data: CreateGenreRequest): Promise<Genre> {
    try {
      const response = await this.apiFetcher.post<BaseResponse<Genre>>('/admin/catalog/genres', data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to create genre');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create genre');
    } catch (error) {
      throw this.handleError(error, 'Failed to create genre');
    }
  }

  public async updateGenre(id: number, data: UpdateGenreRequest): Promise<Genre> {
    try {
      const response = await this.apiFetcher.put<BaseResponse<Genre>>(`/admin/catalog/genres/${id}`, data);
      // Check for error code first
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to update genre');
      }
      // If no errorCode and data exists, return it
      if (response.data?.data) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update genre');
    } catch (error) {
      throw this.handleError(error, 'Failed to update genre');
    }
  }

  public async deleteGenre(id: number): Promise<void> {
    try {
      // Backend returns: { data: null, message?: string, errorCode?: string }
      const response = await this.apiFetcher.delete<BaseResponse<null>>(`/admin/catalog/genres/${id}`);
      if (response.data?.errorCode) {
        throw new Error(response.data.message || 'Failed to delete genre');
      }
      // If no errorCode, deletion was successful
    } catch (error) {
      throw this.handleError(error, 'Failed to delete genre');
    }
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof AxiosError) {
      const errorMessage = 
        (error.response?.data as any)?.error?.message ||
        (error.response?.data as any)?.message ||
        error.message ||
        defaultMessage;
      return new Error(errorMessage);
    }
    if (error instanceof Error) {
      return error;
    }
    return new Error(defaultMessage);
  }
}

