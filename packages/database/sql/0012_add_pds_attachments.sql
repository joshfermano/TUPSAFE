-- Migration: Add pds_attachments table for storing PDS training/civil service certificates
-- This table stores file references for attachments linked to PDS training and civil service entries

CREATE TABLE IF NOT EXISTS "pds_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "pds_submission_id" uuid NOT NULL REFERENCES "pds_submissions"("id") ON DELETE CASCADE,
  "year" integer NOT NULL,
  "training_id" uuid REFERENCES "pds_training"("id") ON DELETE CASCADE,
  "civil_service_id" uuid REFERENCES "pds_civil_service"("id") ON DELETE CASCADE,
  "file_path" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "pds_attachments_user_id_idx" ON "pds_attachments" ("user_id");
CREATE INDEX IF NOT EXISTS "pds_attachments_submission_id_idx" ON "pds_attachments" ("pds_submission_id");
CREATE INDEX IF NOT EXISTS "pds_attachments_year_idx" ON "pds_attachments" ("year");
CREATE INDEX IF NOT EXISTS "pds_attachments_training_id_idx" ON "pds_attachments" ("training_id");
CREATE INDEX IF NOT EXISTS "pds_attachments_civil_service_id_idx" ON "pds_attachments" ("civil_service_id");

-- Composite indexes
CREATE INDEX IF NOT EXISTS "pds_attachments_user_year_idx" ON "pds_attachments" ("user_id", "year");
CREATE INDEX IF NOT EXISTS "pds_attachments_submission_training_idx" ON "pds_attachments" ("pds_submission_id", "training_id");
CREATE INDEX IF NOT EXISTS "pds_attachments_submission_civil_service_idx" ON "pds_attachments" ("pds_submission_id", "civil_service_id");

-- Constraint: Exactly one of training_id or civil_service_id must be set
ALTER TABLE "pds_attachments" ADD CONSTRAINT "pds_attachments_single_reference_check" 
CHECK (
  (training_id IS NOT NULL AND civil_service_id IS NULL) OR
  (training_id IS NULL AND civil_service_id IS NOT NULL)
);

-- RLS Policies for pds_attachments
ALTER TABLE "pds_attachments" ENABLE ROW LEVEL SECURITY;

-- Users can view their own attachments
CREATE POLICY "Users can view own PDS attachments"
ON "pds_attachments" FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins/Co-Admins/HR can view all attachments
CREATE POLICY "Admins can view all PDS attachments"
ON "pds_attachments" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'co_admin', 'hr')
    AND is_active = true
  )
);

-- Users can insert their own attachments
CREATE POLICY "Users can insert own PDS attachments"
ON "pds_attachments" FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own attachments
CREATE POLICY "Users can delete own PDS attachments"
ON "pds_attachments" FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Admins/Co-Admins/HR can manage all attachments
CREATE POLICY "Admins can manage all PDS attachments"
ON "pds_attachments" FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'co_admin', 'hr')
    AND is_active = true
  )
);

