import { readFileSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables from root .env.local
dotenv.config({ path: join(__dirname, '../../../.env.local') });

async function applyMigration() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL not found in environment variables');
  }

  console.log('🔄 Connecting to database...');
  const sql = postgres(databaseUrl);

  try {
    // Read the migration file
    const migrationPath = join(
      __dirname,
      '../sql/0004_sticky_morgan_stark.sql'
    );
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Reading migration: 0004_sticky_morgan_stark.sql');

    // Split by statement-breakpoint
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
        try {
          await sql.unsafe(statement);
          console.log(`✅ Statement ${i + 1} completed`);
        } catch (error: any) {
          // Check if it's a "column already exists" or "constraint already exists" error
          if (
            error.message.includes('already exists') ||
            error.message.includes('duplicate')
          ) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
            throw error;
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');
    console.log('\n📊 SALN metadata columns added:');
    console.log('   - spouse_name');
    console.log('   - position');
    console.log('   - agency');
    console.log('   - office_address');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('\n✨ Done! SALN draft saving should now work correctly.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration error:', error);
    process.exit(1);
  });
