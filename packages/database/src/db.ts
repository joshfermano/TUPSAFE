import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Optimize connection pool for serverless environments
// Increased pool size and added connection lifecycle management
export const client = postgres(connectionString, {
  prepare: false,
  max: 20, // Increased from 10 to handle concurrent requests better
  idle_timeout: 20, // Close idle connections after 20 seconds
  max_lifetime: 60 * 30, // Close connections after 30 minutes
  connect_timeout: 10, // Timeout connection attempts after 10 seconds
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { schema };
