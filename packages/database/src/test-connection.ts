import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from monorepo root
config({ path: resolve(__dirname, '../../../.env.local') });
import { db, client } from './db';
import { sql } from 'drizzle-orm';

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const result = await db.execute(sql`SELECT NOW() as current_time`);
    console.log(`✓ Connected successfully at ${result[0].current_time}\n`);

    // Test 2: Check tables exist
    console.log('2️⃣ Checking if tables exist...');
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    const expectedTables = [
      'profiles',
      'departments',
      'positions',
      'pds_submissions',
      'pds_personal_info',
      'pds_family_background',
      'pds_children',
      'pds_education',
      'pds_civil_service',
      'pds_work_experience',
      'pds_voluntary_work',
      'pds_training',
      'pds_other_info',
      'saln_submissions',
      'saln_real_properties',
      'saln_personal_properties',
      'saln_liabilities',
      'saln_business_interests',
      'saln_relatives_in_gov',
      'submission_deadlines',
      'approval_workflows',
      'audit_logs',
      'notifications',
      'archives',
    ];

    const existingTables = tables.map((row: any) => row.table_name);
    const missingTables = expectedTables.filter(
      (table) => !existingTables.includes(table)
    );

    if (missingTables.length > 0) {
      console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
      console.log('   Run migrations first: npm run db:push\n');
    } else {
      console.log(`✓ All ${expectedTables.length} tables exist\n`);
    }

    // Test 3: Check indexes
    console.log('3️⃣ Checking database indexes...');
    const indexes = await db.execute(sql`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`✓ Found ${indexes.length} indexes\n`);

    // Test 4: Check enums
    console.log('4️⃣ Checking enum types...');
    const enums = await db.execute(sql`
      SELECT typname as enum_name
      FROM pg_type
      WHERE typcategory = 'E'
      ORDER BY typname
    `);

    const expectedEnums = [
      'role',
      'submission_status',
      'sex',
      'civil_status',
      'education_level',
      'property_kind',
      'form_type',
      'filing_type',
      'approval_status',
      'notification_type',
    ];

    const existingEnums = enums.map((row: any) => row.enum_name);
    const missingEnums = expectedEnums.filter(
      (enumName) => !existingEnums.includes(enumName)
    );

    if (missingEnums.length > 0) {
      console.log(`⚠️  Missing enums: ${missingEnums.join(', ')}\n`);
    } else {
      console.log(`✓ All ${expectedEnums.length} enum types exist\n`);
    }

    // Test 5: Check row counts
    console.log('5️⃣ Checking row counts...');
    const counts = await Promise.all([
      db.execute(sql`SELECT COUNT(*) as count FROM profiles`),
      db.execute(sql`SELECT COUNT(*) as count FROM departments`),
      db.execute(sql`SELECT COUNT(*) as count FROM positions`),
      db.execute(sql`SELECT COUNT(*) as count FROM pds_submissions`),
      db.execute(sql`SELECT COUNT(*) as count FROM saln_submissions`),
    ]);

    console.log(`   - Profiles: ${counts[0][0].count}`);
    console.log(`   - Departments: ${counts[1][0].count}`);
    console.log(`   - Positions: ${counts[2][0].count}`);
    console.log(`   - PDS Submissions: ${counts[3][0].count}`);
    console.log(`   - SALN Submissions: ${counts[4][0].count}\n`);

    if (counts.every((c: any) => parseInt(c[0].count) === 0)) {
      console.log('💡 Database is empty. Run seed script: npm run db:seed\n');
    }

    // Summary
    console.log('✅ Database connection test completed!\n');
    console.log('📊 Summary:');
    console.log(`   - Connection: ✓ Working`);
    console.log(
      `   - Tables: ${existingTables.length}/${expectedTables.length}`
    );
    console.log(`   - Indexes: ${indexes.length}`);
    console.log(`   - Enums: ${existingEnums.length}/${expectedEnums.length}`);
    console.log('\n🎯 Next Steps:');

    if (missingTables.length > 0) {
      console.log('   1. Run migrations: npm run db:push');
      console.log('   2. Seed database: npm run db:seed');
    } else if (counts.every((c: any) => parseInt(c[0].count) === 0)) {
      console.log('   1. Seed database: npm run db:seed');
      console.log('   2. Apply RLS policies');
    } else {
      console.log('   1. Database is ready!');
      console.log('   2. View data: npm run db:studio');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check DATABASE_URL in .env.local');
    console.error('   2. Verify Supabase credentials');
    console.error('   3. Ensure port 6543 (Transaction mode)');
    console.error('   4. Check network connectivity\n');
    throw error;
  } finally {
    await client.end();
    process.exit(0);
  }
}

// Run test
testConnection();
