import { db } from '../db';
import { auditLogs } from '../schema';
import type { AuditLog } from '../types';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'LOGIN'
  | 'LOGIN_ATTEMPT'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'DOWNLOAD'
  | 'EXPORT'
  | 'APPROVE_REGISTRATION'
  | 'REJECT_REGISTRATION'
  | 'REQUEST_INFO_REGISTRATION'
  | 'approve_pds_submission'
  | 'reject_pds_submission'
  | 'view_pds_submission'
  | 'request_changes'
  | 'approve_saln_submission'
  | 'reject_saln_submission'
  | 'view_saln_submission'
  | 'bulk_approve_pds_submission'
  | 'bulk_approve_saln_submission';

export type AuditEntityType =
  | 'profile'
  | 'pds_submission'
  | 'saln_submission'
  | 'department'
  | 'position'
  | 'notification'
  | 'approval_workflow'
  | 'file'
  | 'auth'
  | 'registration';

export interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  changes?: Record<string, any>; // Flexible structure for before/after/custom metadata
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 *
 * @param data - Audit log data
 * @returns Promise with created audit log or null on error
 */
export async function createAuditLog(
  data: AuditLogData
): Promise<{ log: AuditLog | null; error: Error | null }> {
  try {
    const [log] = await db
      .insert(auditLogs)
      .values({
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId || null,
        changes: data.changes || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      })
      .returning();

    return { log: log as AuditLog, error: null };
  } catch (error) {
    console.error('Error creating audit log:', error);
    return {
      log: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Create audit log from Next.js request headers
 * Extracts IP address and user agent from request
 *
 * @param userId - User ID performing the action
 * @param action - Action being performed
 * @param entityType - Type of entity
 * @param entityId - Entity ID (optional)
 * @param changes - Before/after changes (optional)
 * @param headers - Request headers (optional)
 * @returns Promise with created audit log
 */
export async function createAuditLogFromRequest(
  userId: string,
  action: AuditAction,
  entityType: AuditEntityType,
  entityId?: string,
  changes?: { before?: Record<string, any>; after?: Record<string, any> },
  headers?: Headers
): Promise<{ log: AuditLog | null; error: Error | null }> {
  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (headers) {
    // Try to get IP from various headers (reverse proxy, cloud functions, etc.)
    ipAddress =
      headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      headers.get('x-real-ip') ||
      headers.get('cf-connecting-ip') ||
      undefined;

    userAgent = headers.get('user-agent') || undefined;
  }

  return createAuditLog({
    userId,
    action,
    entityType,
    entityId,
    changes,
    ipAddress,
    userAgent,
  });
}

/**
 * Create audit log for PDS submission changes
 */
export async function auditPdsSubmission(
  userId: string,
  action: AuditAction,
  submissionId: string,
  changes?: { before?: Record<string, any>; after?: Record<string, any> },
  headers?: Headers
): Promise<void> {
  await createAuditLogFromRequest(
    userId,
    action,
    'pds_submission',
    submissionId,
    changes,
    headers
  );
}

/**
 * Create audit log for SALN submission changes
 */
export async function auditSalnSubmission(
  userId: string,
  action: AuditAction,
  submissionId: string,
  changes?: { before?: Record<string, any>; after?: Record<string, any> },
  headers?: Headers
): Promise<void> {
  await createAuditLogFromRequest(
    userId,
    action,
    'saln_submission',
    submissionId,
    changes,
    headers
  );
}

/**
 * Create audit log for profile changes
 */
export async function auditProfile(
  userId: string,
  action: AuditAction,
  profileId: string,
  changes?: { before?: Record<string, any>; after?: Record<string, any> },
  headers?: Headers
): Promise<void> {
  await createAuditLogFromRequest(
    userId,
    action,
    'profile',
    profileId,
    changes,
    headers
  );
}

/**
 * Create audit log for authentication events
 */
export async function auditAuth(
  userId: string,
  action: 'LOGIN' | 'LOGOUT',
  headers?: Headers
): Promise<void> {
  await createAuditLogFromRequest(
    userId,
    action,
    'auth',
    undefined,
    undefined,
    headers
  );
}

/**
 * Create audit log for file operations
 */
export async function auditFile(
  userId: string,
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE',
  filePath: string,
  metadata?: Record<string, any>,
  headers?: Headers
): Promise<void> {
  await createAuditLogFromRequest(
    userId,
    action,
    'file',
    filePath,
    { after: metadata },
    headers
  );
}

/**
 * Get audit logs for a specific entity
 *
 * @param entityType - Type of entity
 * @param entityId - Entity ID
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Promise with array of audit logs
 */
export async function getEntityAuditLogs(
  entityType: AuditEntityType,
  entityId: string,
  limit: number = 50
): Promise<{ logs: AuditLog[]; error: Error | null }> {
  try {
    const logs = await db.query.auditLogs.findMany({
      where: (auditLogs, { and, eq }) =>
        and(
          eq(auditLogs.entityType, entityType),
          eq(auditLogs.entityId, entityId)
        ),
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
      limit,
    });

    return { logs: logs as AuditLog[], error: null };
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return {
      logs: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get audit logs for a specific user
 *
 * @param userId - User ID
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Promise with array of audit logs
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50
): Promise<{ logs: AuditLog[]; error: Error | null }> {
  try {
    const logs = await db.query.auditLogs.findMany({
      where: (auditLogs, { eq }) => eq(auditLogs.userId, userId),
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
      limit,
    });

    return { logs: logs as AuditLog[], error: null };
  } catch (error) {
    console.error('Error fetching user audit logs:', error);
    return {
      logs: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get recent audit logs with filters
 *
 * @param filters - Optional filters (action, entityType, userId)
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Promise with array of audit logs
 */
export async function getRecentAuditLogs(
  filters?: {
    action?: AuditAction;
    entityType?: AuditEntityType;
    userId?: string;
  },
  limit: number = 100
): Promise<{ logs: AuditLog[]; error: Error | null }> {
  try {
    const logs = await db.query.auditLogs.findMany({
      where: (auditLogs, { and, eq }) => {
        const conditions = [];
        if (filters?.action)
          conditions.push(eq(auditLogs.action, filters.action));
        if (filters?.entityType)
          conditions.push(eq(auditLogs.entityType, filters.entityType));
        if (filters?.userId)
          conditions.push(eq(auditLogs.userId, filters.userId));
        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
      limit,
    });

    return { logs: logs as AuditLog[], error: null };
  } catch (error) {
    console.error('Error fetching recent audit logs:', error);
    return {
      logs: [],
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Export audit logs to JSON (for admin reporting)
 *
 * @param startDate - Start date for export
 * @param endDate - End date for export
 * @returns Promise with JSON string of logs
 */
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date
): Promise<{ json: string | null; error: Error | null }> {
  try {
    const logs = await db.query.auditLogs.findMany({
      where: (auditLogs, { and, gte, lte }) =>
        and(
          gte(auditLogs.createdAt, startDate),
          lte(auditLogs.createdAt, endDate)
        ),
      orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
    });

    const json = JSON.stringify(logs, null, 2);
    return { json, error: null };
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return {
      json: null,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Helper to sanitize sensitive data before logging
 * Removes passwords, tokens, and other sensitive fields
 */
export function sanitizeForAudit(
  data: Record<string, any>
): Record<string, any> {
  const sensitiveFields = [
    'password',
    'token',
    'secret',
    'apiKey',
    'privateKey',
    'accessToken',
    'refreshToken',
  ];

  const sanitized = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForAudit(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Helper to compare objects and generate changes object
 * Used for tracking before/after states
 */
export function generateChanges(
  before: Record<string, any> | null,
  after: Record<string, any> | null
): { before?: Record<string, any>; after?: Record<string, any> } | undefined {
  if (!before && !after) return undefined;

  return {
    before: before ? sanitizeForAudit(before) : undefined,
    after: after ? sanitizeForAudit(after) : undefined,
  };
}
