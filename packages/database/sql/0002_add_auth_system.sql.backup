-- =====================================================
-- Auth System Migration
-- Adds comprehensive authentication tables, enums, and functions
-- Version: 0002
-- =====================================================

-- Create new enums for auth system
DO $$ BEGIN
  CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE otp_type AS ENUM ('email_verification', 'login_challenge', 'password_reset');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Update profiles table with auth-related fields
-- =====================================================

-- Add new columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS account_status account_status DEFAULT 'pending' NOT NULL,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS temporary_password BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index for account_status
CREATE INDEX IF NOT EXISTS profiles_account_status_idx ON profiles(account_status);

-- =====================================================
-- Create OTP Verifications table
-- =====================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  type otp_type NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for otp_verifications
CREATE INDEX IF NOT EXISTS otp_verifications_user_id_idx ON otp_verifications(user_id);
CREATE INDEX IF NOT EXISTS otp_verifications_expires_at_idx ON otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS otp_verifications_type_idx ON otp_verifications(type);
CREATE INDEX IF NOT EXISTS otp_verifications_user_type_idx ON otp_verifications(user_id, type);

-- =====================================================
-- Create Pending Registrations table
-- =====================================================

CREATE TABLE IF NOT EXISTS pending_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  status approval_status DEFAULT 'pending' NOT NULL,
  admin_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for pending_registrations
CREATE INDEX IF NOT EXISTS pending_registrations_user_id_idx ON pending_registrations(user_id);
CREATE INDEX IF NOT EXISTS pending_registrations_status_idx ON pending_registrations(status);
CREATE INDEX IF NOT EXISTS pending_registrations_created_at_idx ON pending_registrations(created_at);

-- =====================================================
-- Create Trusted Devices table
-- =====================================================

CREATE TABLE IF NOT EXISTS trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  browser_info TEXT,
  ip_address INET,
  trusted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for trusted_devices
CREATE INDEX IF NOT EXISTS trusted_devices_user_id_idx ON trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS trusted_devices_device_fingerprint_idx ON trusted_devices(device_fingerprint);
CREATE INDEX IF NOT EXISTS trusted_devices_expires_at_idx ON trusted_devices(expires_at);
CREATE INDEX IF NOT EXISTS trusted_devices_user_device_idx ON trusted_devices(user_id, device_fingerprint);

-- =====================================================
-- Create Employee ID Registry table
-- =====================================================

CREATE TABLE IF NOT EXISTS employee_id_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for employee_id_registry
CREATE INDEX IF NOT EXISTS employee_id_registry_employee_id_idx ON employee_id_registry(employee_id);
CREATE INDEX IF NOT EXISTS employee_id_registry_user_id_idx ON employee_id_registry(user_id);

-- =====================================================
-- Database Functions
-- =====================================================

-- Function to generate unique TUPM-XXXXX employee ID
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate random 5-digit number
    new_id := 'TUPM-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Check if ID already exists
    SELECT EXISTS(SELECT 1 FROM employee_id_registry WHERE employee_id = new_id) INTO id_exists;

    -- Exit loop if unique
    EXIT WHEN NOT id_exists;
  END LOOP;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create profile for new user (trigger on auth.users insert)
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_employee_id TEXT;
BEGIN
  -- Generate unique employee ID
  new_employee_id := generate_employee_id();

  -- Insert into employee_id_registry
  INSERT INTO employee_id_registry (employee_id, user_id)
  VALUES (new_employee_id, NEW.id);

  -- Create profile (only if not exists)
  INSERT INTO profiles (
    id,
    employee_id,
    first_name,
    last_name,
    account_status,
    is_active,
    created_at,
    updated_at
  )
  SELECT
    NEW.id,
    new_employee_id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    'pending',
    TRUE,
    NOW(),
    NOW()
  WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Function to cleanup expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM otp_verifications
  WHERE expires_at < NOW() AND verified_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired devices
CREATE OR REPLACE FUNCTION cleanup_expired_devices()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM trusted_devices
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_id_registry ENABLE ROW LEVEL SECURITY;

-- OTP Verifications policies
-- Users can view their own OTPs
CREATE POLICY "Users can view own OTPs"
  ON otp_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own OTPs
CREATE POLICY "Users can insert own OTPs"
  ON otp_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own OTPs (mark as verified)
CREATE POLICY "Users can update own OTPs"
  ON otp_verifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to OTPs"
  ON otp_verifications
  USING (auth.jwt()->>'role' = 'service_role');

-- Pending Registrations policies
-- Users can view their own registration status
CREATE POLICY "Users can view own registration"
  ON pending_registrations FOR SELECT
  USING (auth.uid() = user_id);

-- HR and Admin can view all registrations
CREATE POLICY "HR and Admin can view all registrations"
  ON pending_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- HR and Admin can update registrations
CREATE POLICY "HR and Admin can update registrations"
  ON pending_registrations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to registrations"
  ON pending_registrations
  USING (auth.jwt()->>'role' = 'service_role');

-- Trusted Devices policies
-- Users can view their own devices
CREATE POLICY "Users can view own devices"
  ON trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own devices
CREATE POLICY "Users can insert own devices"
  ON trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own devices
CREATE POLICY "Users can update own devices"
  ON trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete own devices"
  ON trusted_devices FOR DELETE
  USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role has full access to devices"
  ON trusted_devices
  USING (auth.jwt()->>'role' = 'service_role');

-- Employee ID Registry policies
-- Users can view their own employee ID
CREATE POLICY "Users can view own employee ID"
  ON employee_id_registry FOR SELECT
  USING (auth.uid() = user_id);

-- HR and Admin can view all employee IDs
CREATE POLICY "HR and Admin can view all employee IDs"
  ON employee_id_registry FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('hr', 'admin')
    )
  );

-- Service role has full access
CREATE POLICY "Service role has full access to employee IDs"
  ON employee_id_registry
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- Scheduled Cleanup (requires pg_cron extension)
-- Note: This requires pg_cron to be enabled in Supabase
-- =====================================================

-- Cleanup expired OTPs every hour
-- SELECT cron.schedule('cleanup-expired-otps', '0 * * * *', 'SELECT cleanup_expired_otps()');

-- Cleanup expired devices every day at 2 AM
-- SELECT cron.schedule('cleanup-expired-devices', '0 2 * * *', 'SELECT cleanup_expired_devices()');

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE otp_verifications IS 'Stores OTP codes for email verification and login challenges';
COMMENT ON TABLE pending_registrations IS 'Admin approval queue for new user registrations';
COMMENT ON TABLE trusted_devices IS '30-day device trust for seamless login experience';
COMMENT ON TABLE employee_id_registry IS 'Prevents TUPM-XXXXX employee ID collisions';

COMMENT ON FUNCTION generate_employee_id() IS 'Generates unique TUPM-XXXXX employee ID';
COMMENT ON FUNCTION create_profile_for_new_user() IS 'Automatically creates profile when user signs up';
COMMENT ON FUNCTION cleanup_expired_otps() IS 'Removes expired OTP codes';
COMMENT ON FUNCTION cleanup_expired_devices() IS 'Removes devices older than 30 days';
