-- Migration: Create user_preferences table for admin portal settings
-- Description: Stores user preferences for admin portal including notifications, theme, and dashboard layout

-- Create email_digest_frequency enum
DO $$ BEGIN
  CREATE TYPE email_digest_frequency AS ENUM ('realtime', 'daily', 'weekly', 'never');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create theme enum
DO $$ BEGIN
  CREATE TYPE theme AS ENUM ('light', 'dark', 'system');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create dashboard_layout enum
DO $$ BEGIN
  CREATE TYPE dashboard_layout AS ENUM ('default', 'compact', 'detailed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create language enum
DO $$ BEGIN
  CREATE TYPE language AS ENUM ('en', 'fil');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Notification preferences
  email_notifications_enabled BOOLEAN DEFAULT true,
  email_digest_frequency email_digest_frequency DEFAULT 'daily',

  -- UI preferences
  theme theme DEFAULT 'system',
  dashboard_layout dashboard_layout DEFAULT 'default',
  language language DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'Asia/Manila',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one preference record per user
  UNIQUE(user_id)
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Add RLS policies for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create default preferences for existing users (optional - run after migration if needed)
-- INSERT INTO user_preferences (user_id)
-- SELECT id FROM profiles
-- WHERE NOT EXISTS (
--   SELECT 1 FROM user_preferences WHERE user_preferences.user_id = profiles.id
-- );
