/**
 * Mock Audit Logs Generator for Admin Portal
 *
 * This file generates realistic audit log entries for development and testing purposes.
 * In production, these would come from the actual database audit logging system.
 */

import { MockDatabase } from '@tupsafe/mock-data';
import type { AuditLog } from '@tupsafe/types';

/**
 * Audit action types
 */
export type AuditAction =
  | 'user.login'
  | 'user.logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'pds.created'
  | 'pds.updated'
  | 'pds.submitted'
  | 'pds.approved'
  | 'pds.rejected'
  | 'pds.deleted'
  | 'saln.created'
  | 'saln.updated'
  | 'saln.submitted'
  | 'saln.approved'
  | 'saln.rejected'
  | 'saln.deleted'
  | 'system.settings_updated'
  | 'system.backup_created'
  | 'system.data_export';

/**
 * Audit resource types
 */
export type AuditResource = 'user' | 'pds' | 'saln' | 'system' | 'department' | 'position';

/**
 * Generate mock IP addresses
 */
function generateMockIp(): string {
  const ips = [
    '192.168.1.101',
    '192.168.1.102',
    '10.0.0.15',
    '172.16.0.50',
    '192.168.100.25',
  ];
  return ips[Math.floor(Math.random() * ips.length)];
}

/**
 * Generate mock user agents
 */
function generateMockUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * Generate a random date within the last N days
 */
function getRandomDateInLastDays(days: number): Date {
  const now = Date.now();
  const randomTime = Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(now - randomTime);
}

/**
 * Generate mock audit logs
 *
 * Creates realistic audit log entries for various user activities,
 * submission actions, and system events.
 *
 * @param count - Number of audit logs to generate (default: 100)
 * @returns Array of mock audit logs sorted by date (newest first)
 */
export function generateMockAuditLogs(count: number = 100): AuditLog[] {
  const logs: AuditLog[] = [];
  const users = MockDatabase.profiles;
  const pdsSubmissions = MockDatabase.pdsSubmissions;
  const salnSubmissions = MockDatabase.salnSubmissions;

  // Generate login/logout events
  for (let i = 0; i < Math.floor(count * 0.3); i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const isLogin = Math.random() > 0.3;

    logs.push({
      id: `audit-${crypto.randomUUID()}`,
      userId: user.id,
      action: isLogin ? 'user.login' : 'user.logout',
      resource: 'user',
      resourceId: user.id,
      metadata: {
        userName: `${user.firstName} ${user.lastName}`,
        employeeId: user.employeeId,
        role: user.role,
        department: user.departmentId,
      },
      ipAddress: generateMockIp(),
      userAgent: generateMockUserAgent(),
      createdAt: getRandomDateInLastDays(30),
    });
  }

  // Generate PDS-related events
  for (let i = 0; i < Math.floor(count * 0.25); i++) {
    const pds = pdsSubmissions[Math.floor(Math.random() * pdsSubmissions.length)];
    const user = MockDatabase.getProfile(pds.userId);
    const actions: AuditAction[] = [
      'pds.created',
      'pds.updated',
      'pds.submitted',
      'pds.approved',
      'pds.rejected',
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];

    logs.push({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.id || pds.userId,
      action,
      resource: 'pds',
      resourceId: pds.id,
      metadata: {
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        submissionId: pds.id,
        status: pds.status,
        version: pds.version,
        isLatest: pds.isLatest,
      },
      ipAddress: generateMockIp(),
      userAgent: generateMockUserAgent(),
      createdAt: getRandomDateInLastDays(60),
    });
  }

  // Generate SALN-related events
  for (let i = 0; i < Math.floor(count * 0.25); i++) {
    const saln = salnSubmissions[Math.floor(Math.random() * salnSubmissions.length)];
    const user = MockDatabase.getProfile(saln.userId);
    const actions: AuditAction[] = [
      'saln.created',
      'saln.updated',
      'saln.submitted',
      'saln.approved',
      'saln.rejected',
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];

    logs.push({
      id: `audit-${crypto.randomUUID()}`,
      userId: user?.id || saln.userId,
      action,
      resource: 'saln',
      resourceId: saln.id,
      metadata: {
        userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        submissionId: saln.id,
        year: saln.year,
        status: saln.status,
      },
      ipAddress: generateMockIp(),
      userAgent: generateMockUserAgent(),
      createdAt: getRandomDateInLastDays(60),
    });
  }

  // Generate user management events (HR/Admin only)
  const adminUsers = users.filter((u) => u.role === 'hr' || u.role === 'admin');
  for (let i = 0; i < Math.floor(count * 0.1); i++) {
    const admin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const targetUser = users[Math.floor(Math.random() * users.length)];
    const actions: AuditAction[] = ['user.created', 'user.updated', 'user.role_changed'];
    const action = actions[Math.floor(Math.random() * actions.length)];

    logs.push({
      id: `audit-${crypto.randomUUID()}`,
      userId: admin.id,
      action,
      resource: 'user',
      resourceId: targetUser.id,
      metadata: {
        adminName: `${admin.firstName} ${admin.lastName}`,
        targetUserName: `${targetUser.firstName} ${targetUser.lastName}`,
        targetEmployeeId: targetUser.employeeId,
        newRole: targetUser.role,
        department: targetUser.departmentId,
      },
      ipAddress: generateMockIp(),
      userAgent: generateMockUserAgent(),
      createdAt: getRandomDateInLastDays(90),
    });
  }

  // Generate system events
  for (let i = 0; i < Math.floor(count * 0.1); i++) {
    const admin = adminUsers[Math.floor(Math.random() * adminUsers.length)];
    const actions: AuditAction[] = [
      'system.settings_updated',
      'system.backup_created',
      'system.data_export',
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];

    logs.push({
      id: `audit-${crypto.randomUUID()}`,
      userId: admin.id,
      action,
      resource: 'system',
      metadata: {
        adminName: `${admin.firstName} ${admin.lastName}`,
        actionType: action.split('.')[1],
      },
      ipAddress: generateMockIp(),
      userAgent: generateMockUserAgent(),
      createdAt: getRandomDateInLastDays(90),
    });
  }

  // Sort by date (newest first)
  return logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Filter audit logs by user ID
 *
 * @param logs - Array of audit logs
 * @param userId - User ID to filter by
 * @returns Filtered audit logs
 */
export function filterLogsByUser(logs: AuditLog[], userId: string | null): AuditLog[] {
  if (!userId || userId === 'all') {
    return logs;
  }
  return logs.filter((log) => log.userId === userId);
}

/**
 * Filter audit logs by action
 *
 * @param logs - Array of audit logs
 * @param action - Action type to filter by
 * @returns Filtered audit logs
 */
export function filterLogsByAction(logs: AuditLog[], action: string | null): AuditLog[] {
  if (!action || action === 'all') {
    return logs;
  }
  return logs.filter((log) => log.action === action);
}

/**
 * Filter audit logs by resource
 *
 * @param logs - Array of audit logs
 * @param resource - Resource type to filter by
 * @returns Filtered audit logs
 */
export function filterLogsByResource(logs: AuditLog[], resource: string | null): AuditLog[] {
  if (!resource || resource === 'all') {
    return logs;
  }
  return logs.filter((log) => log.resource === resource);
}

/**
 * Filter audit logs by date range
 *
 * @param logs - Array of audit logs
 * @param startDate - Start date of range
 * @param endDate - End date of range
 * @returns Filtered audit logs
 */
export function filterLogsByDateRange(
  logs: AuditLog[],
  startDate: Date | null,
  endDate: Date | null
): AuditLog[] {
  if (!startDate && !endDate) {
    return logs;
  }

  return logs.filter((log) => {
    const logDate = new Date(log.createdAt);

    if (startDate && logDate < startDate) {
      return false;
    }

    if (endDate && logDate > endDate) {
      return false;
    }

    return true;
  });
}

/**
 * Get audit log statistics
 *
 * @param logs - Array of audit logs
 * @returns Statistics about the logs
 */
export function getAuditLogStats(logs: AuditLog[]) {
  const actionCounts: Record<string, number> = {};
  const resourceCounts: Record<string, number> = {};
  const userCounts: Record<string, number> = {};

  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
  });

  return {
    total: logs.length,
    byAction: actionCounts,
    byResource: resourceCounts,
    byUser: userCounts,
    dateRange: {
      earliest: logs.length > 0 ? logs[logs.length - 1].createdAt : null,
      latest: logs.length > 0 ? logs[0].createdAt : null,
    },
  };
}

/**
 * Get unique action types from logs
 *
 * @param logs - Array of audit logs
 * @returns Array of unique action types
 */
export function getUniqueActions(logs: AuditLog[]): string[] {
  return Array.from(new Set(logs.map((log) => log.action))).sort();
}

/**
 * Get unique resource types from logs
 *
 * @param logs - Array of audit logs
 * @returns Array of unique resource types
 */
export function getUniqueResources(logs: AuditLog[]): string[] {
  return Array.from(new Set(logs.map((log) => log.resource))).sort();
}
