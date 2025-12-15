/**
 * Common Admin API Response Types
 *
 * Shared types used across admin API endpoints
 */

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: string;
  field?: string;
}

/**
 * Standard API success response
 */
export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

/**
 * Pagination metadata for list responses
 *
 * Provides information about the current page, total items, and navigation.
 */
export interface PaginationMeta {
  /**
   * Total number of items matching the query
   */
  total: number;

  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Number of items per page
   */
  pageSize: number;

  /**
   * Total number of pages
   */
  totalPages: number;
}
