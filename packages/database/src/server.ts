/**
 * Database Package - Server-Only Exports
 *
 * This module provides server-side database functionality including
 * Drizzle ORM, database schemas, and server-only utilities.
 *
 * IMPORTANT: Only import this in server-side code:
 * - API routes
 * - Server Components
 * - Server Actions
 * - Backend scripts
 *
 * DO NOT import in client components or browser code.
 *
 * @module server
 */

// ============================================================================
// DATABASE CONNECTION (Server-Only)
// ============================================================================
export { db, client } from './db';

// ============================================================================
// DATABASE SCHEMAS (Server-Only)
// ============================================================================
export * from './schema';

// ============================================================================
// DATABASE QUERIES (Server-Only)
// ============================================================================
export * from './queries';

// ============================================================================
// DATABASE MUTATIONS (Server-Only)
// ============================================================================
export * from './mutations';

// ============================================================================
// SERVER-ONLY UTILITIES
// ============================================================================
export * from './utils/storage';
export * from './utils/audit-log';
export * from './utils/admin-employee-id';
export * from './utils/employee-id-dob';

// ============================================================================
// TYPES (Re-exported for convenience)
// ============================================================================
export type * from './types';
export type * from './types/realtime';
