// Database connection and client (server-only)
export { db, client } from './db';

// Database schemas (server-only)
export * from './schema';

// Server-only utilities
export * from './utils/storage';
export * from './utils/audit-log';
export * from './utils/admin-employee-id';

// Re-export types for convenience
export type * from './types';
export type * from './types/realtime';
