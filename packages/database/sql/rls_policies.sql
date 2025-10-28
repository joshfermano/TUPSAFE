-- =========================================
-- Row Level Security (RLS) Policies for TUPSAFE
-- TUP Manila PDS/SALN Compliance System
-- =========================================

-- Enable RLS on all tables first
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_family_background ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_civil_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_work_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_voluntary_work ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE pds_other_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_real_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_personal_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_business_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE saln_relatives_in_gov ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;

-- =========================================
-- Helper Functions for RLS
-- =========================================

-- Function to get current user's profile
CREATE OR REPLACE FUNCTION auth.current_user_profile()
RETURNS TABLE (
  user_id uuid,
  role text,
  department_id uuid,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.role::text,
    p.department_id,
    p.is_active
  FROM profiles p
  WHERE p.id = auth.uid()
  AND p.is_active = true;
$$;

-- Function to check if user has admin privileges
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND is_active = true
  );
$$;

-- Function to check if user has HR privileges
CREATE OR REPLACE FUNCTION auth.is_hr_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('hr', 'admin')
    AND is_active = true
  );
$$;

-- Function to check if user has supervisor privileges
CREATE OR REPLACE FUNCTION auth.is_supervisor_or_above()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('supervisor', 'hr', 'admin')
    AND is_active = true
  );
$$;

-- Function to check if user has auditor privileges
CREATE OR REPLACE FUNCTION auth.is_auditor_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('auditor', 'admin')
    AND is_active = true
  );
$$;

-- =========================================
-- Core User Management Policies
-- =========================================

-- Profiles: Users can view their own profile, HR/Admin can view all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR auth.is_hr_or_admin()
  );

CREATE POLICY "HR and Admin can manage profiles" ON profiles
  FOR ALL USING (auth.is_hr_or_admin());

-- Departments: Everyone can read, only admin can modify
CREATE POLICY "Everyone can read departments" ON departments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage departments" ON departments
  FOR ALL USING (auth.is_admin());

-- Positions: Everyone can read, only admin can modify
CREATE POLICY "Everyone can read positions" ON positions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage positions" ON positions
  FOR ALL USING (auth.is_admin());

-- =========================================
-- PDS (Personal Data Sheet) Policies
-- =========================================

-- PDS Submissions: Users own their data, HR/Admin can view all
CREATE POLICY "Users can manage own PDS submissions" ON pds_submissions
  FOR ALL USING (
    user_id = auth.uid() OR auth.is_hr_or_admin()
  );

-- PDS Personal Info: Same access as submissions
CREATE POLICY "Users can manage own PDS personal info" ON pds_personal_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_personal_info.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Family Background
CREATE POLICY "Users can manage own PDS family background" ON pds_family_background
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_family_background.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Children
CREATE POLICY "Users can manage own PDS children" ON pds_children
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_children.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Education
CREATE POLICY "Users can manage own PDS education" ON pds_education
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_education.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Civil Service
CREATE POLICY "Users can manage own PDS civil service" ON pds_civil_service
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_civil_service.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Work Experience
CREATE POLICY "Users can manage own PDS work experience" ON pds_work_experience
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_work_experience.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Voluntary Work
CREATE POLICY "Users can manage own PDS voluntary work" ON pds_voluntary_work
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_voluntary_work.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Training
CREATE POLICY "Users can manage own PDS training" ON pds_training
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_training.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- PDS Other Info
CREATE POLICY "Users can manage own PDS other info" ON pds_other_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = pds_other_info.pds_submission_id
      AND (ps.user_id = auth.uid() OR auth.is_hr_or_admin())
    )
  );

-- =========================================
-- SALN (Statement of Assets, Liabilities, Net Worth) Policies
-- =========================================

-- SALN Submissions: Users own their data, HR/Admin/Auditor can view
CREATE POLICY "Users can manage own SALN submissions" ON saln_submissions
  FOR ALL USING (
    user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin()
  );

-- SALN Real Properties
CREATE POLICY "Users can manage own SALN real properties" ON saln_real_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = saln_real_properties.saln_submission_id
      AND (ss.user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin())
    )
  );

-- SALN Personal Properties
CREATE POLICY "Users can manage own SALN personal properties" ON saln_personal_properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = saln_personal_properties.saln_submission_id
      AND (ss.user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin())
    )
  );

-- SALN Liabilities
CREATE POLICY "Users can manage own SALN liabilities" ON saln_liabilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = saln_liabilities.saln_submission_id
      AND (ss.user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin())
    )
  );

-- SALN Business Interests
CREATE POLICY "Users can manage own SALN business interests" ON saln_business_interests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = saln_business_interests.saln_submission_id
      AND (ss.user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin())
    )
  );

-- SALN Relatives in Government
CREATE POLICY "Users can manage own SALN relatives in gov" ON saln_relatives_in_gov
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = saln_relatives_in_gov.saln_submission_id
      AND (ss.user_id = auth.uid() OR auth.is_hr_or_admin() OR auth.is_auditor_or_admin())
    )
  );

-- =========================================
-- Administrative Policies
-- =========================================

-- Submission Deadlines: Everyone can read, only admin can modify
CREATE POLICY "Everyone can read submission deadlines" ON submission_deadlines
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage submission deadlines" ON submission_deadlines
  FOR ALL USING (auth.is_admin());

-- Approval Workflows: Approvers can see workflows assigned to them
CREATE POLICY "Users can view relevant approval workflows" ON approval_workflows
  FOR SELECT USING (
    approver_id = auth.uid() OR
    auth.is_hr_or_admin() OR
    EXISTS (
      SELECT 1 FROM pds_submissions ps
      WHERE ps.id = approval_workflows.submission_id
      AND ps.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM saln_submissions ss
      WHERE ss.id = approval_workflows.submission_id
      AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Approvers can update workflows" ON approval_workflows
  FOR UPDATE USING (
    approver_id = auth.uid() OR auth.is_hr_or_admin()
  );

CREATE POLICY "HR and Admin can create workflows" ON approval_workflows
  FOR INSERT WITH CHECK (auth.is_hr_or_admin());

-- Audit Logs: Only admin and auditors can view
CREATE POLICY "Admin and auditors can view audit logs" ON audit_logs
  FOR SELECT USING (auth.is_auditor_or_admin());

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true); -- Allow system to insert logs

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Archives: Only admin and auditors can access
CREATE POLICY "Admin and auditors can access archives" ON archives
  FOR SELECT USING (auth.is_auditor_or_admin());

CREATE POLICY "Admin can manage archives" ON archives
  FOR ALL USING (auth.is_admin());

-- =========================================
-- Additional Security Measures
-- =========================================

-- Function to audit data changes (to be called by triggers)
CREATE OR REPLACE FUNCTION audit.log_data_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    changes,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('old', to_jsonb(OLD))
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('new', to_jsonb(NEW))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    END,
    inet_client_addr(),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create audit triggers for sensitive tables
CREATE TRIGGER audit_pds_submissions
  AFTER INSERT OR UPDATE OR DELETE ON pds_submissions
  FOR EACH ROW EXECUTE FUNCTION audit.log_data_change();

CREATE TRIGGER audit_saln_submissions
  AFTER INSERT OR UPDATE OR DELETE ON saln_submissions
  FOR EACH ROW EXECUTE FUNCTION audit.log_data_change();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_data_change();

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create audit schema for functions
CREATE SCHEMA IF NOT EXISTS audit;
GRANT USAGE ON SCHEMA audit TO authenticated;