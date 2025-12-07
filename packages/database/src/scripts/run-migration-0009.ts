/**
 * Run Migration 0009: Add review_notes to saln_submissions
 *
 * This script applies the migration to add the review_notes column
 * to the saln_submissions table.
 */

import { config } from 'dotenv';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../../../..', '.env.local') });

async function runMigration() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
  }

  console.log('Connecting to database...');
  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    // Read migration file
    const migrationPath = join(__dirname, '../../sql/0009_add_saln_review_notes.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Running migration 0009_add_saln_review_notes...');
    console.log('SQL:', migrationSQL);

    // Execute migration
    await sql.unsafe(migrationSQL);

    console.log('Migration completed successfully!');

    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'saln_submissions'
        AND column_name = 'review_notes'
    `;

    if (result.length > 0) {
      console.log('Verification successful:', result[0]);
    } else {
      console.error('Verification failed: column not found');
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
