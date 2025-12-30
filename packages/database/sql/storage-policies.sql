-- ============================================================================
-- TUPSAFE Storage Bucket Policies
-- ============================================================================
-- Apply these policies AFTER creating storage buckets via npm run storage:setup
-- Execute in Supabase Dashboard → Storage → Policies
-- ============================================================================

-- ============================================================================
-- POLICY 1: Users can view their own files (PDS, SALN, User Documents)
-- ============================================================================
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY 2: Users can view their own profile picture
-- ============================================================================
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY 3: All authenticated users can view others' profile pictures
-- ============================================================================
CREATE POLICY "View all profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures');

-- ============================================================================
-- POLICY 3b: All authenticated users can view PDS attachments (public bucket)
-- ============================================================================
CREATE POLICY "View all PDS attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pds-attachments');

-- ============================================================================
-- POLICY 4: Users can upload their own documents
-- ============================================================================
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents', 'profile-pictures', 'pds-attachments') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY 5: Users can update their own files
-- ============================================================================
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents', 'profile-pictures', 'pds-attachments') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY 6: Users can delete their own files
-- ============================================================================
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('pds-submissions', 'saln-submissions', 'user-documents', 'profile-pictures', 'pds-attachments') AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- POLICY 7: Admins, Co-Admins, and HR have full access to all buckets
-- ============================================================================
CREATE POLICY "Admins and HR full access"
ON storage.objects FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'co_admin', 'hr')
    AND is_active = true
  )
);

-- ============================================================================
-- POLICY 8: Supervisors can view user documents
-- ============================================================================
CREATE POLICY "Supervisors can view user documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role = 'supervisor'
    AND is_active = true
  )
);

-- ============================================================================
-- POLICY 9: Archives are admin/co-admin/HR only
-- ============================================================================
CREATE POLICY "Archives admin only"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'archives' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() 
    AND role IN ('admin', 'co_admin', 'hr')
    AND is_active = true
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify policies are working:

-- Check bucket policies
/*
SELECT 
  policyname,
  tablename,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;
*/

-- Test as user (replace with actual user ID)
/*
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'user-uuid-here';

-- Should see own files only
SELECT * FROM storage.objects WHERE bucket_id = 'user-documents';

-- Should see all profile pictures
SELECT * FROM storage.objects WHERE bucket_id = 'profile-pictures';
*/

-- ============================================================================
-- NOTES
-- ============================================================================
/*
File Path Structure:
- pds-submissions:    {userId}/{submissionId}/pds_v{version}.pdf
- saln-submissions:   {userId}/{submissionId}/saln_{year}.pdf
- archives:           {userId}/{submissionId}/archived_{timestamp}.pdf
- profile-pictures:   {userId}/avatar.{ext}
- user-documents:     {userId}/{category}/{filename}
                      Categories: certifications, seminars, trainings, licenses, awards
- pds-attachments:    {userId}/{year}/{pdsSubmissionId}/{kind}/{itemId}/{uuid}.{ext}
                      kind = training | civil_service
                      itemId = trainingId or civilServiceId

Access Patterns:
1. Users can upload/view/delete their own files
2. All users can view profile pictures (for collaboration/identification)
3. All users can view PDS attachments (public bucket for certificates/seminar docs)
4. Admins/HR can access all files across all buckets
5. Supervisors can view user documents for verification
6. Archives are restricted to admin/HR only

Security:
- Most buckets are PRIVATE (not publicly accessible)
- profile-pictures and pds-attachments are PUBLIC (for public URL access)
- Access requires authentication
- RLS policies enforce user-level isolation for write operations
- File paths include user ID for easy policy enforcement
*/

