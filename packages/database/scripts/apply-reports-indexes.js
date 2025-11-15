#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

async function applyIndexes() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  // Extract database info for display
  const dbInfo = DATABASE_URL.split('@')[1]?.split('/')[0] || 'unknown';

  console.log('🚀 Applying reports performance indexes to database...');
  console.log('📊 Database:', dbInfo);
  console.log('');

  // Read SQL file
  const sqlFile = fs.readFileSync(
    path.join(__dirname, '../sql/reports_performance_indexes.sql'),
    'utf8'
  );

  // Create database client
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    // Connect to database
    await client.connect();
    console.log('✓ Connected to database');

    // Split SQL into statements, separating VACUUM/ANALYZE commands
    const statements = sqlFile.split(';').filter(s => s.trim());
    const regularStatements = [];
    const vacuumStatements = [];

    statements.forEach(stmt => {
      const trimmed = stmt.trim();
      if (trimmed.toUpperCase().startsWith('VACUUM') ||
          (trimmed.toUpperCase().startsWith('ANALYZE') && !trimmed.includes('CREATE'))) {
        vacuumStatements.push(trimmed);
      } else if (trimmed && !trimmed.startsWith('--')) {
        regularStatements.push(trimmed);
      }
    });

    // Execute regular statements (CREATE INDEX, etc.)
    console.log('🔨 Creating indexes...');
    for (const stmt of regularStatements) {
      if (stmt.trim()) {
        await client.query(stmt);
      }
    }
    console.log('✓ Indexes created successfully');

    // Execute VACUUM/ANALYZE commands outside transaction
    if (vacuumStatements.length > 0) {
      console.log('🧹 Running VACUUM and ANALYZE...');
      for (const stmt of vacuumStatements) {
        try {
          await client.query(stmt);
        } catch (err) {
          console.log(`  ⚠️  Warning: ${err.message}`);
        }
      }
      console.log('✓ Maintenance commands completed');
    }

    console.log('');
    console.log('✅ All operations completed successfully');

  } catch (error) {
    console.error('❌ Error creating indexes:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('✓ Database connection closed');
  }
}

applyIndexes();
