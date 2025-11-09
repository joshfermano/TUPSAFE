# Idempotent Migration Guide for TUPSAFE

## Why Idempotency Matters

An **idempotent migration** can be run multiple times without causing errors or unintended side effects. This is crucial for:

1. **Development workflow** - Developers can sync their local database without manual cleanup
2. **CI/CD pipelines** - Automated deployments won't fail if a migration was partially applied
3. **Production safety** - Rollback and re-deploy scenarios are safer
4. **Team collaboration** - Multiple developers can work on migrations without conflicts

## PostgreSQL Idempotent Patterns

### 1. Creating Enum Types

**Problem:** `CREATE TYPE` fails if the type already exists

**Solution:** Wrap in PL/pgSQL exception handler

```sql
DO $$ BEGIN
  CREATE TYPE "public"."status_enum" AS ENUM('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

### 2. Creating Tables

**Problem:** `CREATE TABLE` fails if the table already exists

**Solution:** Use `IF NOT EXISTS`

```sql
CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY NOT NULL,
  "email" text UNIQUE NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
```

### 3. Adding Columns

**Problem:** `ALTER TABLE ADD COLUMN` fails if the column already exists

**Solution:** Use `IF NOT EXISTS` (PostgreSQL 9.6+)

```sql
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" status_enum DEFAULT 'draft' NOT NULL;
```

**Note:** For complex columns with constraints, you may need a DO block:

```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users' AND column_name='complex_column'
  ) THEN
    ALTER TABLE users ADD COLUMN complex_column jsonb DEFAULT '{}';
    -- Add additional constraints here
  END IF;
END $$;
```

### 4. Dropping Constraints

**Problem:** `ALTER TABLE DROP CONSTRAINT` fails if the constraint doesn't exist

**Solution:** Use `IF EXISTS`

```sql
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_user_id_users_id_fk";
```

### 5. Creating Indexes

**Problem:** `CREATE INDEX` fails if the index already exists

**Solution:** Use `IF NOT EXISTS`

```sql
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
CREATE INDEX IF NOT EXISTS "posts_user_id_status_idx" ON "posts" USING btree ("user_id", "status");
```

### 6. Dropping Indexes

**Problem:** `DROP INDEX` fails if the index doesn't exist

**Solution:** Use `IF EXISTS`

```sql
DROP INDEX IF EXISTS "old_index_name";
```

### 7. Adding Foreign Keys

**Problem:** Foreign key constraints may already exist

**Solution:** Check before adding

```sql
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_user_id_users_id_fk'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_user_id_users_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
END $$;
```

### 8. Modifying Column Types

**Problem:** `ALTER TABLE ALTER COLUMN TYPE` may fail or have data loss

**Solution:** Check and handle safely

```sql
DO $$ BEGIN
  -- Check current column type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='users'
    AND column_name='age'
    AND data_type='integer'
  ) THEN
    ALTER TABLE users ALTER COLUMN age TYPE bigint;
  END IF;
END $$;
```

### 9. Creating Extensions

**Problem:** `CREATE EXTENSION` fails if already enabled

**Solution:** Use `IF NOT EXISTS`

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 10. Creating Schemas

**Problem:** `CREATE SCHEMA` fails if schema exists

**Solution:** Use `IF NOT EXISTS`

```sql
CREATE SCHEMA IF NOT EXISTS "audit";
```

## Drizzle Kit Best Practices

### 1. Generate Migrations Incrementally

```bash
# After making schema changes
cd packages/database
npx drizzle-kit generate
```

This creates a new migration file in `sql/` directory.

### 2. Review Generated Migrations

**ALWAYS** review the generated SQL before applying:

```bash
# Look at the latest migration
ls -lt sql/*.sql | head -1
cat sql/XXXX_migration_name.sql
```

### 3. Make Migrations Idempotent

Apply the patterns from this guide to the generated SQL:

- Add `IF NOT EXISTS` to CREATE statements
- Add `IF EXISTS` to DROP statements
- Wrap enum creation in exception handlers
- Add conditional checks for complex operations

### 4. Test Migrations Locally

```bash
# Apply migration to local database
npx drizzle-kit push

# Verify it's idempotent by running again
npx drizzle-kit push
# Should show: "No changes detected"
```

### 5. Use Drizzle Studio to Inspect

```bash
npx drizzle-kit studio
# Opens GUI at http://localhost:4983
```

## Common Migration Scenarios

### Adding Authentication Fields

```sql
-- Add account status enum
DO $$ BEGIN
  CREATE TYPE "public"."account_status" AS ENUM('pending', 'active', 'suspended', 'deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to users table
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "account_status" account_status DEFAULT 'pending' NOT NULL;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS "profiles_account_status_idx" ON "profiles" USING btree ("account_status");
```

### Refactoring Foreign Keys

```sql
-- Drop old constraint if exists
ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "posts_author_id_users_id_fk";

-- Add new constraint with better naming
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'posts_user_id_fk'
  ) THEN
    ALTER TABLE posts
    ADD CONSTRAINT posts_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
```

### Adding Audit Trail

```sql
-- Create audit schema
CREATE SCHEMA IF NOT EXISTS "audit";

-- Create audit log table
CREATE TABLE IF NOT EXISTS "audit"."logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "table_name" text NOT NULL,
  "operation" text NOT NULL,
  "old_data" jsonb,
  "new_data" jsonb,
  "user_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "audit_logs_table_name_idx" ON "audit"."logs" ("table_name");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit"."logs" ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit"."logs" ("created_at");
```

## Testing Checklist

Before pushing a migration to production:

- [ ] Generated migration reviewed
- [ ] All CREATE statements use IF NOT EXISTS (where applicable)
- [ ] All DROP statements use IF EXISTS
- [ ] Enum types wrapped in exception handlers
- [ ] Complex operations use conditional DO blocks
- [ ] Migration tested locally by running twice
- [ ] Second run shows "No changes detected"
- [ ] Drizzle Studio shows correct schema
- [ ] Foreign key relationships intact
- [ ] Indexes created successfully
- [ ] No data loss or corruption
- [ ] Rollback plan documented (if needed)

## Common Errors and Solutions

### Error: "type already exists"

**Cause:** Enum type being created without exception handling

**Fix:**
```sql
DO $$ BEGIN
  CREATE TYPE enum_name AS ENUM(...);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
```

### Error: "relation already exists"

**Cause:** Table or index being created without IF NOT EXISTS

**Fix:**
```sql
CREATE TABLE IF NOT EXISTS table_name (...);
CREATE INDEX IF NOT EXISTS index_name ON table_name (...);
```

### Error: "column already exists"

**Cause:** Adding column without IF NOT EXISTS

**Fix:**
```sql
ALTER TABLE table_name ADD COLUMN IF NOT EXISTS column_name type;
```

### Error: "constraint does not exist"

**Cause:** Dropping constraint without IF EXISTS

**Fix:**
```sql
ALTER TABLE table_name DROP CONSTRAINT IF EXISTS constraint_name;
```

## Version Control Best Practices

1. **Never modify applied migrations** - Create a new migration instead
2. **Name migrations descriptively** - `0001_add_user_authentication.sql`
3. **Document complex migrations** - Add comments explaining the "why"
4. **Keep migrations focused** - One logical change per migration
5. **Test before committing** - Ensure idempotency locally

## Resources

- [PostgreSQL IF NOT EXISTS Documentation](https://www.postgresql.org/docs/current/sql-createtable.html)
- [Drizzle Kit Documentation](https://orm.drizzle.team/kit-docs/overview)
- [TUPSAFE Database Package](/packages/database/README.md)
- [Migration Fix Example](/packages/database/MIGRATION_FIX_SUMMARY.md)

---

**Author:** TUPSAFE Development Team
**Last Updated:** 2025-01-10
**Version:** 1.0
