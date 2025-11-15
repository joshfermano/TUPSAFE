/**
 * Audit Logs API Types and Validation Schemas
 *
 * Provides type-safe validation schemas for admin audit log management
 * using Zod for runtime validation.
 */

import { z } from 'zod';

/**
 * Audit Logs list query parameters
 * Supports pagination, search, filtering, and sorting
 */
export const auditLogsQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),

  // Filters
  user: z.string().uuid().optional(), // Filter by userId
  action: z.string().optional(), // Filter by action type
  resource: z.string().optional(), // Filter by entityType

  // Search (in changes/metadata JSONB fields)
  search: z.string().max(200).optional(),

  // Date range filtering
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Sorting
  sortBy: z.enum(['createdAt', 'action', 'user']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AuditLogsQuery = z.infer<typeof auditLogsQuerySchema>;

/**
 * Single audit log item for list view
 */
export interface AuditLogListItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null; // JSONB field - flexible structure
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;

  // User details (joined from profiles table)
  user: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string | null;
  };
}

/**
 * Audit logs list response with pagination and stats
 */
export interface AuditLogsListResponse {
  logs: AuditLogListItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  stats: {
    totalLogs: number;
    uniqueUsers: number;
    totalActions: number;
    resourcesAffected: number;
  };
}

/**
 * Export parameters validation
 * Used when exporting audit logs to CSV/JSON
 */
export const auditLogsExportSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(['csv', 'json']).default('csv'),
  user: z.string().uuid().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
});

export type AuditLogsExportParams = z.infer<typeof auditLogsExportSchema>;
