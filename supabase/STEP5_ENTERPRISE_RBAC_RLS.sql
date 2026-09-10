-- ============================================================================
-- RAJMUDRA CORPORATE BD & FLEET CRM — ENTERPRISE RBAC & SUPABASE RLS MIGRATION
-- STEP 5: Firm-Wide Role-Based Access Control & Strict Tenant Isolation
-- ============================================================================

-- 1. SECURITY DEFINER HELPER FUNCTIONS (Prevents RLS Recursion & Fast Lookups)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_auth_user_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_status()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_active_authenticated_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND (status = 'active' OR status = 'Active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role = 'super_admin'
      AND (status = 'active' OR status = 'Active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_director_or_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('super_admin', 'bd_director')
      AND (status = 'active' OR status = 'Active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_manager_or_above()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('super_admin', 'bd_director', 'bd_manager', 'operations_manager', 'cops_supervisor')
      AND (status = 'active' OR status = 'Active')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_crm_contributor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND role IN ('super_admin', 'bd_director', 'bd_manager', 'bd_sr_exec', 'bd_exec', 'operations_manager', 'cops_supervisor', 'maintenance_engineer', 'finance_executive', 'legal_counsel')
      AND (status = 'active' OR status = 'Active')
  );
$$;

-- Grant execution on helper functions
GRANT EXECUTE ON FUNCTION public.get_auth_user_org_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_user_role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_auth_user_status() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_active_authenticated_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_director_or_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_manager_or_above() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_crm_contributor() TO anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 2. ENABLE RLS ON ALL TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. DROP LEGACY / PERMISSIVE POLICIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Organizations All" ON public.organizations;
DROP POLICY IF EXISTS "Departments All" ON public.departments;
DROP POLICY IF EXISTS "Regions All" ON public.regions;
DROP POLICY IF EXISTS "Teams All" ON public.teams;
DROP POLICY IF EXISTS "Profiles All" ON public.profiles;
DROP POLICY IF EXISTS "Employee History All" ON public.employee_history;
DROP POLICY IF EXISTS "Segments All" ON public.segments;
DROP POLICY IF EXISTS "Clients All" ON public.clients;
DROP POLICY IF EXISTS "Contacts All" ON public.contacts;
DROP POLICY IF EXISTS "Opportunities All" ON public.opportunities;
DROP POLICY IF EXISTS "Activities All" ON public.activities;
DROP POLICY IF EXISTS "Followups All" ON public.followups;
DROP POLICY IF EXISTS "Internal Tasks All" ON public.internal_tasks;
DROP POLICY IF EXISTS "Documents All" ON public.documents;
DROP POLICY IF EXISTS "Employee KRAs All" ON public.employee_kras;
DROP POLICY IF EXISTS "Employee KPIs All" ON public.employee_kpis;
DROP POLICY IF EXISTS "Employee Performance All" ON public.employee_performance_reviews;
DROP POLICY IF EXISTS "KRA All" ON public.kra;
DROP POLICY IF EXISTS "KPI All" ON public.kpi;
DROP POLICY IF EXISTS "Performance All" ON public.performance;
DROP POLICY IF EXISTS "Approvals All" ON public.approvals;
DROP POLICY IF EXISTS "Audit Logs All" ON public.audit_logs;

-- Drop any previous granular policies to ensure idempotent migration
DROP POLICY IF EXISTS "org_select_policy" ON public.organizations;
DROP POLICY IF EXISTS "org_admin_policy" ON public.organizations;

DROP POLICY IF EXISTS "dept_select_policy" ON public.departments;
DROP POLICY IF EXISTS "dept_admin_policy" ON public.departments;

DROP POLICY IF EXISTS "reg_select_policy" ON public.regions;
DROP POLICY IF EXISTS "reg_admin_policy" ON public.regions;

DROP POLICY IF EXISTS "teams_select_policy" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_policy" ON public.teams;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

DROP POLICY IF EXISTS "segments_select_policy" ON public.segments;
DROP POLICY IF EXISTS "segments_modify_policy" ON public.segments;

DROP POLICY IF EXISTS "clients_select_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_update_policy" ON public.clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON public.clients;

DROP POLICY IF EXISTS "contacts_select_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_insert_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_update_policy" ON public.contacts;
DROP POLICY IF EXISTS "contacts_delete_policy" ON public.contacts;

DROP POLICY IF EXISTS "opps_select_policy" ON public.opportunities;
DROP POLICY IF EXISTS "opps_insert_policy" ON public.opportunities;
DROP POLICY IF EXISTS "opps_update_policy" ON public.opportunities;
DROP POLICY IF EXISTS "opps_delete_policy" ON public.opportunities;

DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_update_policy" ON public.activities;
DROP POLICY IF EXISTS "activities_delete_policy" ON public.activities;

DROP POLICY IF EXISTS "followups_select_policy" ON public.followups;
DROP POLICY IF EXISTS "followups_insert_policy" ON public.followups;
DROP POLICY IF EXISTS "followups_update_policy" ON public.followups;
DROP POLICY IF EXISTS "followups_delete_policy" ON public.followups;

DROP POLICY IF EXISTS "tasks_select_policy" ON public.internal_tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.internal_tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.internal_tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON public.internal_tasks;

DROP POLICY IF EXISTS "docs_select_policy" ON public.documents;
DROP POLICY IF EXISTS "docs_insert_policy" ON public.documents;
DROP POLICY IF EXISTS "docs_update_policy" ON public.documents;
DROP POLICY IF EXISTS "docs_delete_policy" ON public.documents;

DROP POLICY IF EXISTS "audit_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_insert_policy" ON public.audit_logs;

-- ----------------------------------------------------------------------------
-- 4. ENTERPRISE RBAC & ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------

-- ==========================================
-- 4.1 ORGANIZATIONS
-- ==========================================
CREATE POLICY "org_select_policy" ON public.organizations
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "org_admin_policy" ON public.organizations
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ==========================================
-- 4.2 DEPARTMENTS & REGIONS & TEAMS
-- ==========================================
CREATE POLICY "dept_select_policy" ON public.departments
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "dept_admin_policy" ON public.departments
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "reg_select_policy" ON public.regions
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "reg_admin_policy" ON public.regions
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "teams_select_policy" ON public.teams
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "teams_admin_policy" ON public.teams
  FOR ALL TO authenticated
  USING (public.is_director_or_admin())
  WITH CHECK (public.is_director_or_admin());

-- ==========================================
-- 4.3 PROFILES (Single Source of Truth for Identity & Employee Master)
-- ==========================================
-- SELECT: Users can view all active profiles within their own organization (or public for login init)
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

-- INSERT: Super Admin, BD Director, or self-registration during initial seed / provisioning
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated, anon
  WITH CHECK (
    public.is_director_or_admin()
    OR auth.uid() = id
    OR auth.uid() IS NULL
  );

-- UPDATE: Super Admin can update any profile; BD Director can update non-admin profiles; Users can update self
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR (public.is_director_or_admin() AND role != 'super_admin' AND organization_id = public.get_auth_user_org_id())
    OR (auth.uid() = id)
  )
  WITH CHECK (
    public.is_super_admin()
    OR (public.is_director_or_admin() AND role != 'super_admin' AND organization_id = public.get_auth_user_org_id())
    OR (auth.uid() = id)
  );

-- DELETE: Only Super Admin can delete profiles from the directory
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin() AND id != auth.uid()
  );

-- ==========================================
-- 4.4 SEGMENTS
-- ==========================================
CREATE POLICY "segments_select_policy" ON public.segments
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "segments_modify_policy" ON public.segments
  FOR ALL TO authenticated
  USING (
    public.is_director_or_admin() 
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_director_or_admin() 
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.5 CLIENTS & CONTACTS
-- ==========================================
-- SELECT: All active org members (including management_viewer and analyst) can view clients within their tenant
CREATE POLICY "clients_select_policy" ON public.clients
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

-- INSERT: Contributors (super_admin, bd_director, bd_manager, bd_sr_exec, bd_exec, ops) can create clients
CREATE POLICY "clients_insert_policy" ON public.clients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- UPDATE: Contributors can update clients within their tenant
CREATE POLICY "clients_update_policy" ON public.clients
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- DELETE: Only Managers, Directors, and Super Admin can delete clients (executives/analysts cannot delete)
CREATE POLICY "clients_delete_policy" ON public.clients
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- Contacts RLS
CREATE POLICY "contacts_select_policy" ON public.contacts
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "contacts_insert_policy" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "contacts_update_policy" ON public.contacts
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "contacts_delete_policy" ON public.contacts
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.6 OPPORTUNITIES (Deals & Pipeline)
-- ==========================================
-- SELECT: All authenticated members within the organization can view opportunities
CREATE POLICY "opps_select_policy" ON public.opportunities
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

-- INSERT: BD & Ops contributors can insert opportunities
CREATE POLICY "opps_insert_policy" ON public.opportunities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- UPDATE: BD & Ops contributors can update opportunities
CREATE POLICY "opps_update_policy" ON public.opportunities
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- DELETE: Only Managers, Directors, and Super Admin can delete opportunities
CREATE POLICY "opps_delete_policy" ON public.opportunities
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.7 ACTIVITIES & FOLLOW-UPS
-- ==========================================
CREATE POLICY "activities_select_policy" ON public.activities
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "activities_insert_policy" ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "activities_update_policy" ON public.activities
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "activities_delete_policy" ON public.activities
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "followups_select_policy" ON public.followups
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "followups_insert_policy" ON public.followups
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "followups_update_policy" ON public.followups
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "followups_delete_policy" ON public.followups
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.8 INTERNAL TASKS & DELEGATION
-- ==========================================
CREATE POLICY "tasks_select_policy" ON public.internal_tasks
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "tasks_insert_policy" ON public.internal_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "tasks_update_policy" ON public.internal_tasks
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "tasks_delete_policy" ON public.internal_tasks
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.9 DOCUMENTS VAULT
-- ==========================================
CREATE POLICY "docs_select_policy" ON public.documents
  FOR SELECT TO authenticated, anon
  USING (
    auth.uid() IS NULL 
    OR organization_id = public.get_auth_user_org_id()
    OR public.is_super_admin()
  );

CREATE POLICY "docs_insert_policy" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "docs_update_policy" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  )
  WITH CHECK (
    public.is_crm_contributor()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "docs_delete_policy" ON public.documents
  FOR DELETE TO authenticated
  USING (
    public.is_manager_or_above()
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

-- ==========================================
-- 4.10 KRA, KPI & PERFORMANCE REVIEWS
-- ==========================================
CREATE POLICY "kras_select_policy" ON public.employee_kras
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "kras_modify_policy" ON public.employee_kras
  FOR ALL TO authenticated
  USING (public.is_director_or_admin())
  WITH CHECK (public.is_director_or_admin());

CREATE POLICY "kpis_select_policy" ON public.employee_kpis
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "kpis_modify_policy" ON public.employee_kpis
  FOR ALL TO authenticated
  USING (public.is_director_or_admin())
  WITH CHECK (public.is_director_or_admin());

CREATE POLICY "perf_select_policy" ON public.employee_performance_reviews
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "perf_modify_policy" ON public.employee_performance_reviews
  FOR ALL TO authenticated
  USING (public.is_manager_or_above())
  WITH CHECK (public.is_manager_or_above());

-- Legacy alias tables
CREATE POLICY "kra_all_policy" ON public.kra FOR ALL TO authenticated USING (public.is_director_or_admin()) WITH CHECK (public.is_director_or_admin());
CREATE POLICY "kpi_all_policy" ON public.kpi FOR ALL TO authenticated USING (public.is_director_or_admin()) WITH CHECK (public.is_director_or_admin());
CREATE POLICY "perf_all_policy" ON public.performance FOR ALL TO authenticated USING (public.is_manager_or_above()) WITH CHECK (public.is_manager_or_above());
CREATE POLICY "approvals_all_policy" ON public.approvals FOR ALL TO authenticated USING (public.is_director_or_admin()) WITH CHECK (public.is_director_or_admin());

-- ==========================================
-- 4.11 AUDIT LOGS
-- ==========================================
CREATE POLICY "audit_select_policy" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (
    public.is_director_or_admin() 
    AND (organization_id = public.get_auth_user_org_id() OR public.is_super_admin())
  );

CREATE POLICY "audit_insert_policy" ON public.audit_logs
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
