import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';
import * as schema from './schema';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });

// Lazy initialization for build-time compatibility
// The database connection is only created when it's actually used,
// not when the module is imported. This allows Next.js to build
// without requiring DATABASE_URL at build time.

let _client: Sql | null = null;
let _db: PostgresJsDatabase<typeof schema> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return connectionString;
}

function initializeClient(): Sql {
  if (!_client) {
    const connectionString = getConnectionString();
    // Optimize connection pool for serverless environments
    // Increased pool size and added connection lifecycle management
    _client = postgres(connectionString, {
      prepare: false,
      max: 20, // Increased from 10 to handle concurrent requests better
      idle_timeout: 20, // Close idle connections after 20 seconds
      max_lifetime: 60 * 30, // Close connections after 30 minutes
      connect_timeout: 10, // Timeout connection attempts after 10 seconds
      onnotice: () => {},
    });
  }
  return _client;
}

function initializeDb(): PostgresJsDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(initializeClient(), { schema });
  }
  return _db;
}

// Export getters that lazily initialize the connection
// This ensures the DATABASE_URL is only required at runtime, not build time
export const client = new Proxy({} as Sql, {
  get(_, prop) {
    return Reflect.get(initializeClient(), prop);
  },
});

export const db = new Proxy({} as PostgresJsDatabase<typeof schema>, {
  get(_, prop) {
    return Reflect.get(initializeDb(), prop);
  },
});

export type Database = PostgresJsDatabase<typeof schema>;
export { schema };
