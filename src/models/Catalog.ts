export interface Book {
  id: number;
  title: string;
  isbn?: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
  bookType: 'PHYSICAL' | 'EBOOK';
  language: string;
  publishedDate?: string;
  pageCount?: number;
  fileSize?: number; // For ebooks
  fileFormat?: string; // For ebooks
  authors?: Author[];
  translators?: Translator[];
  publisher?: Publisher;
  genres?: Genre[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookRequest {
  title: string;
  isbn?: string;
  description?: string;
  coverImageUrl?: string;
  price: number;
  bookType: 'PHYSICAL' | 'EBOOK';
  language: string;
  publishedDate?: string;
  pageCount?: number;
  fileSize?: number;
  fileFormat?: string;
  authorIds?: number[];
  translatorIds?: number[];
  publisherId?: number;
  genreIds?: number[];
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
  bio?: string;
  nationality?: string;
  birthDate?: string;
  deathDate?: string;
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
  nationality?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTranslatorRequest {
  name: string;
  bio?: string;
  nationality?: string;
}

export interface UpdateTranslatorRequest {
  name?: string;
  bio?: string;
  nationality?: string;
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
  id: number;
  name: string;
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



