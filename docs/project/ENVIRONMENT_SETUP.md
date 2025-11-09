# Environment Setup Guide

## Supabase Configuration

### Step 1: Get Supabase Credentials

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (or create a new one)
3. Navigate to **Settings > API**

You'll need the following credentials:

- **Project URL**: `https://your-project-id.supabase.co`
- **Anon/Public Key**: Found under "Project API keys" → `anon` `public`
- **Service Role Key**: Found under "Project API keys" → `service_role` (⚠️ Keep this secret!)

4. Navigate to **Settings > Database > Connection string**
5. Select **URI** tab and copy the connection string
6. **Important**: Change the port from `5432` to `6543` for Transaction mode (required for Drizzle ORM)

### Step 2: Create Environment Files

Create a `.env.local` file in the root directory with the following content:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Connection (use port 6543 for Transaction mode)
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
```

### Step 3: Configure Apps

Copy the root `.env.local` to both apps:

```bash
# For Employee Portal
cp .env.local apps/employee/.env.local

# For Admin Portal
cp .env.local apps/admin/.env.local
```

Update the `NEXT_PUBLIC_APP_URL` in each:

- Employee: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Admin: `NEXT_PUBLIC_APP_URL=http://localhost:3001`

### Step 4: Verify Setup

Test database connection:

```bash
cd packages/database
npm run db:studio
```

This should open Drizzle Studio at http://localhost:4983

## Resend Email Configuration

Your Resend SMTP is already configured in Supabase. No additional environment variables needed.

To verify:

1. Go to Supabase Dashboard > **Authentication > Email**
2. Confirm "Enable Custom SMTP" is enabled
3. Verify sender email: `tupsafe@test.com`
4. Sender name: `TUPSAFE`
5. Host: `smtp.resend.com`
6. Port: `465`

## Required Environment Variables Reference

| Variable                        | Description                  | Location   |
| ------------------------------- | ---------------------------- | ---------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL         | Public     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous public key         | Public     |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (admin)     | **SECRET** |
| `DATABASE_URL`                  | PostgreSQL connection string | **SECRET** |
| `NEXT_PUBLIC_APP_URL`           | Application base URL         | Public     |

## Security Notes

⚠️ **NEVER commit `.env.local` files to version control!**

✅ `.env.local` is already in `.gitignore`
✅ Only share credentials through secure channels
✅ Rotate keys if accidentally exposed
✅ Use different credentials for development and production

## Troubleshooting

### Database Connection Fails

- Ensure you're using port **6543** (Transaction mode), not 5432
- Verify your IP is allowed in Supabase Dashboard > Settings > Database > Network Restrictions
- Check that your password doesn't contain special characters that need URL encoding

### Email OTP Not Sending

- Confirm Resend SMTP is configured in Supabase Dashboard
- Check Supabase Dashboard > Authentication > Email Templates
- Verify sender email is verified in Resend dashboard

### "Invalid API Key" Error

- Ensure you're using the correct key (anon for client, service_role for server)
- Check for extra spaces or line breaks when copying keys
- Regenerate keys if necessary from Supabase Dashboard
