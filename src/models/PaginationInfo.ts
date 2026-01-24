export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalResults: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}