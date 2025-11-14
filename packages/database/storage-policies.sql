-- =====================================================
-- TUPSAFE Storage Policies
-- =====================================================
-- This file contains all Row Level Security (RLS) policies
-- for Supabase Storage buckets in the TUPSAFE application.
--
-- Buckets:
-- 1. pds-submissions (PDF only, 10MB limit)
-- 2. saln-submissions (PDF only, 10MB limit)
-- 3. archives (PDF only, no limit)
-- 4. profile-pictures (Images only, 5MB limit)
-- 5. user-documents (PDF & Images, 10MB limit)
-- 6. job-application-documents (PDF, Images & Word docs, 20MB limit)
--
-- Instructions:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy and paste this entire file
-- 3. Execute the SQL
-- 4. Verify policies are created under Storage → Policies
-- =====================================================

-- =====================================================
-- HELPER FUNCTION: Check if user is Admin or HR
-- =====================================================
CREATE OR REPLACE FUNCTION is_admin_or_hr()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'hr')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. PDS SUBMISSIONS BUCKET POLICIES
-- =====================================================

-- Users can view their own PDS files
CREATE POLICY "Users can view own PDS files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own PDS files
CREATE POLICY "Users can upload own PDS files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own PDS files (for drafts)
CREATE POLICY "Users can update own PDS files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own PDS files (for drafts)
CREATE POLICY "Users can delete own PDS files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin/HR can view all PDS files
CREATE POLICY "Admin/HR can view all PDS files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  is_admin_or_hr()
);

-- Admin/HR can manage all PDS files
CREATE POLICY "Admin/HR can manage all PDS files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'pds-submissions' AND
  is_admin_or_hr()
);

-- =====================================================
-- 2. SALN SUBMISSIONS BUCKET POLICIES
-- =====================================================

-- Users can view their own SALN files
CREATE POLICY "Users can view own SALN files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'saln-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own SALN files
CREATE POLICY "Users can upload own SALN files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'saln-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own SALN files (for drafts)
CREATE POLICY "Users can update own SALN files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'saln-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own SALN files (for drafts)
CREATE POLICY "Users can delete own SALN files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'saln-submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin/HR can view all SALN files
CREATE POLICY "Admin/HR can view all SALN files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'saln-submissions' AND
  is_admin_or_hr()
);

-- Admin/HR can manage all SALN files
CREATE POLICY "Admin/HR can manage all SALN files"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'saln-submissions' AND
  is_admin_or_hr()
);

-- =====================================================
-- 3. ARCHIVES BUCKET POLICIES
-- =====================================================
-- Only Admin/HR can access archives

-- Admin/HR can view all archives
CREATE POLICY "Admin/HR can view archives"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'archives' AND
  is_admin_or_hr()
);

-- Admin/HR can upload to archives
CREATE POLICY "Admin/HR can upload archives"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'archives' AND
  is_admin_or_hr()
);

-- Admin/HR can update archives
CREATE POLICY "Admin/HR can update archives"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'archives' AND
  is_admin_or_hr()
);

-- Admin/HR can delete archives
CREATE POLICY "Admin/HR can delete archives"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'archives' AND
  is_admin_or_hr()
);

-- =====================================================
-- 4. PROFILE PICTURES BUCKET POLICIES
-- =====================================================

-- All authenticated users can view all profile pictures
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

-- Users can upload their own profile picture
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own profile picture
CREATE POLICY "Users can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own profile picture
CREATE POLICY "Users can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin can manage all profile pictures
CREATE POLICY "Admin can manage all profile pictures"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  is_admin_or_hr()
);

-- =====================================================
-- 5. USER DOCUMENTS BUCKET POLICIES
-- =====================================================

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can upload their own documents
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own documents
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin/HR can view all user documents
CREATE POLICY "Admin/HR can view all user documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  is_admin_or_hr()
);

-- Admin/HR can manage all user documents
CREATE POLICY "Admin/HR can manage all user documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  is_admin_or_hr()
);

-- =====================================================
-- 6. JOB APPLICATION DOCUMENTS BUCKET POLICIES
-- =====================================================

-- Applicants can view their own application documents
CREATE POLICY "Applicants can view own application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-application-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Applicants can upload their own application documents
CREATE POLICY "Applicants can upload own application documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'job-application-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Applicants can update their own application documents
CREATE POLICY "Applicants can update own application documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'job-application-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Applicants can delete their own application documents
CREATE POLICY "Applicants can delete own application documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'job-application-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admin/HR can view all application documents
CREATE POLICY "Admin/HR can view all application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'job-application-documents' AND
  is_admin_or_hr()
);

-- Admin/HR can manage all application documents
CREATE POLICY "Admin/HR can manage all application documents"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'job-application-documents' AND
  is_admin_or_hr()
);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify policies are created:

-- List all storage policies
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';

-- Count policies per bucket
-- SELECT
--   policyname,
--   cmd,
--   qual
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects'
-- ORDER BY policyname;

-- Test helper function
-- SELECT is_admin_or_hr();
