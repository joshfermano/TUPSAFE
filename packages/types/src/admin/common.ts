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
