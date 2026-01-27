import type { PaginationInfo } from './PaginationInfo';
import type { BaseResponse } from './Api';

export type BookStatus = 'PUBLISHED' | 'UNPUBLISHED';
export type BookType = 'PHYSICAL' | 'EBOOK';

export interface Book {
  id: number;
  title: string;
  isbn?: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
  bookType: BookType;
  hasPhysicalEdition: boolean;
  hasEbookEdition: boolean;
  language: string;
  publishedDate?: string;
  status?: BookStatus;
  authors?: Author[];
  translators?: Translator[];
  publisher?: Publisher;
  genres?: Genre[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookRequest {
  title: string;
  description?: string;
  language: string;
  publicationDate?: string;
  pageCount?: number;
  edition?: number;
  authorIds: number[];
  translatorIds?: number[];
  publisherId?: number;
  genreIds?: number[];
  // Book type flags
  hasPhysicalEdition?: boolean;
  hasElectricEdition?: boolean;
  // Physical book fields
  isbn?: string;
  coverType?: string;
  weightGrams?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
  physicalBookPrice?: number;
  // Ebook fields
  eisbn?: string;
  ebookPrice?: number;
  // Images
  images?: BookImageData[];
}

export interface BookImageData {
  id?: number;
  fileName?: string;
  fileType?: string;
  base64Data?: string;
  url?: string;
  position?: number;
  isCover?: boolean;
  isBackCover?: boolean;
}

export interface UpdateBookRequest {
  title?: string;
  isbn?: string;
  description?: string;
  coverImageUrl?: string;
  price?: number;
  language?: string;
  publishedDate?: string;
  pageCount?: number;
  fileSize?: number;
  fileFormat?: string;
  authorIds?: number[];
  translatorIds?: number[];
  publisherId?: number;
  genreIds?: number[];
}

export interface Author {
  id: number;
  name: string;
  bio?: string;
  nationality?: string;
  birthDate?: string;
  deathDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAuthorRequest {
  name: string;
  biography?: string;
  nationality?: string;
  birthDate?: string;
  image?: ImageData;
}

export interface ImageData {
  fileName?: string;
  fileType?: string;
  base64Data: string;
}

export interface UpdateAuthorRequest {
  name?: string;
  bio?: string;
  nationality?: string;
  birthDate?: string;
  deathDate?: string;
}

export interface Translator {
  id: number;
  name: string;
  bio?: string;
  biography?: string;
  birthDate?: string;
  image?: {
    id?: number;
    url?: string;
    fileName?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTranslatorRequest {
  name: string;
  biography?: string;
  birthDate?: string;
  image?: ImageData;
}

export interface UpdateTranslatorRequest {
  name?: string;
  biography?: string;
  birthDate?: string;
  photoUrl?: string;
}

export interface Publisher {
  id: number;
  name: string;
  description?: string;
  website?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePublisherRequest {
  name: string;
  description?: string;
  website?: string;
}

export interface UpdatePublisherRequest {
  name?: string;
  description?: string;
  website?: string;
}

export interface Genre {
  id?: number;
  name?: string;
  code?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGenreRequest {
  name: string;
  description?: string;
}

export interface UpdateGenreRequest {
  name?: string;
  description?: string;
}

export interface ReviewSource {
  title: string;
  url: string;
}

export interface Review {
  id: number;
  bookId: number;
  userId?: number;
  title?: string;
  rating?: number;
  content?: string;
  isAiGenerated?: boolean;
  sources?: ReviewSource[];
  status: 'DRAFT' | 'PUBLISHED' | 'REJECTED' | 'RETRACT';
  createdAt?: string;
  updatedAt?: string;
}

export interface PhysicalBookInformation {
  isbn?: string;
  publicationDate?: string;
  currentPrice?: number;
  coverType?: string;
  weightGrams?: number;
  heightCm?: number;
  widthCm?: number;
  lengthCm?: number;
}

export interface EbookFile {
  id: number;
  fileName: string;
  fileType?: string;
  url: string;
  downloadCount?: number;
  createdAt?: string;
}

export interface UploadResponse {
  id?: number;
  key: string;
  uploadUrl: string;
}

export interface EbookInformation {
  isbn?: string;
  publicationDate?: string;
  currentPrice?: number;
  files?: EbookFile[];
}

export interface BookDetail {
  id: number;
  code?: string;
  title: string;
  description?: string;
  language: string;
  edition: number;
  pageCount: number;
  status?: BookStatus;
  authors?: Author[];
  translators?: Translator[];
  genres?: Genre[];
  publisher?: Publisher;
  images?: BookImageData[];
  hasPhysicalEdition?: boolean;
  hasEbookEdition?: boolean;
  physicalBookInfo?: PhysicalBookInformation;
  ebookInfo?: EbookInformation;
}

export interface GetBookCatalogPageResponse {
  books: Book[];
  pagination: PaginationInfo;
}

export interface GetAuthorPageResponse {
  authors: Author[];
  pagination: PaginationInfo;
}

export interface GetGenrePageResponse {
  genres: Genre[];
  pagination: PaginationInfo;
}

export interface GetPublisherPageResponse {
  publishers: Publisher[];
  pagination: PaginationInfo;
}

export interface GetTranslatorPageResponse {
  translators: Translator[];
  pagination: PaginationInfo;
}





















