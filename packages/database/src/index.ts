/**
 * Database Package - Client-Safe Exports
 *
 * This is the main entry point for the @tupsafe/database package.
 * It only exports client-safe code to prevent bundling server-side
 * dependencies (Drizzle, PostgreSQL, Node.js modules) into the client bundle.
 *
 * For server-side operations, use:
 * - '@tupsafe/database/server' - Server-only exports (db, schema, etc.)
 * - '@tupsafe/database/queries' - Database query functions
 *
 * For client-side operations, use:
 * - '@tupsafe/database' - Main export (this file)
 * - '@tupsafe/database/client' - Explicit client exports
 * - '@tupsafe/database/hooks' - Realtime hooks only
 *
 * @module index
 */

// ============================================================================
// TYPES (Client-Safe)
// ============================================================================
export type * from './types';
export type * from './types/realtime';

// ============================================================================
// REALTIME HOOKS (Client-Safe, marked with 'use client')
// ============================================================================
export * from './hooks';

// ============================================================================
// REALTIME UTILITIES (Client-Safe)
// ============================================================================
export * from './utils/realtime-connection';
