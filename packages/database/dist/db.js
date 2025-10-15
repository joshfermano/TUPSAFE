import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
}
export const client = postgres(connectionString, {
    prepare: false,
    max: 10,
    onnotice: () => { }, // Suppress notices
});
export const db = drizzle(client, { schema });
export { schema };
