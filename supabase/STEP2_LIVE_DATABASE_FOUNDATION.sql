-- ==============================================================================
-- CorpBD CRM — STEP 2: LIVE SUPABASE DATABASE FOUNDATION MIGRATION
-- Project: Rajmudra Corporate BD & Fleet Mobility Platform
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Enable Core Cryptographic & UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Primary Organization Exists
INSERT INTO public.organizations (id, name, slug, legal_entity_name, primary_domain, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rajmudra Corporate Fleet Solutions Ltd',
  'rajmudra-fleet',
  'Rajmudra Corporate Fleet Solutions Private Limited',
  'rajmudragroup.com',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true;

-- 3. Core Table: departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  department_name text NOT NULL,
  department_code text NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_dept_code UNIQUE (organization_id, department_code),
  CONSTRAINT uq_org_dept_name UNIQUE (organization_id, department_name)
);

-- Seed Canonical Departments: Exactly 6 Active, 4 Inactive Preserved
INSERT INTO public.departments (id, organization_id, department_name, department_code, description, is_active)
VALUES
  -- 6 Active Departments
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Business Development', 'BD', 'Corporate client acquisition, RFP formulation, and revenue growth across regions.', true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Operations', 'OPS', 'Fleet operations, dispatch management, driver scheduling, and route optimization.', true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Centralised Operations', 'COP', 'Central Command Centre, 24/7 telematics, GPS tracking, and pan-India trip monitoring.', true),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Maintenance', 'MNT', 'Fleet workshop management, preventive vehicle servicing, and asset reliability.', true),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Finance', 'FIN', 'Billing, invoicing, commercial pricing calculations, receivables, and accounting.', true),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Legal', 'LEG', 'Contract drafting, SLA compliance, regulatory permits, and NDA governance.', true),
  -- 4 Inactive Preserved Departments
  ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'Human Resources', 'HR', 'Personnel, recruitment, and payroll administration (Preserved / Inactive in CRM).', false),
  ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Administration', 'ADM', 'General corporate administration and facility management (Preserved / Inactive in CRM).', false),
  ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Management / Corporate', 'MGT', 'Executive board and corporate leadership (Preserved / Inactive in CRM).', false),
  ('30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'IT / Technology', 'IT', 'Software systems and network infrastructure (Preserved / Inactive in CRM).', false)
ON CONFLICT (id) DO UPDATE SET
  department_name = EXCLUDED.department_name,
  is_active = EXCLUDED.is_active;

-- 4. Core Table: regions
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  regional_head_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_region_code UNIQUE (organization_id, code)
);

INSERT INTO public.regions (id, organization_id, name, code, description, is_active)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'West Region', 'REG-WEST', 'Maharashtra, Gujarat, Goa hubs', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'North Region', 'REG-NORTH', 'Delhi NCR, Haryana, Punjab, Rajasthan hubs', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'South Region', 'REG-SOUTH', 'Karnataka, Tamil Nadu, Telangana hubs', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'East Region', 'REG-EAST', 'West Bengal, Odisha, Eastern hubs', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Central Region', 'REG-CENTRAL', 'Madhya Pradesh, Chhattisgarh hubs', true)
ON CONFLICT (id) DO NOTHING;

-- 5. Core Table: teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  department text DEFAULT 'Business Development',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  region text DEFAULT 'West Region',
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  annual_target_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  description text,
  leader_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_team_code UNIQUE (organization_id, code)
);

-- 6. Core Table: profiles (Single Source of Truth for Identity & Employee Master)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'bd_exec' NOT NULL,
  department text DEFAULT 'Business Development' NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation text DEFAULT 'Executive',
  employee_id text,
  phone text,
  avatar_url text,
  avatar_bg text DEFAULT '#3b82f6',
  region text DEFAULT 'West',
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  location text DEFAULT 'Corporate HQ - Mumbai',
  joining_date date DEFAULT current_date,
  employment_type text DEFAULT 'Full-time',
  is_regional_owner boolean DEFAULT false,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'active' NOT NULL,
  annual_target_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  allowed_segments text[] DEFAULT '{}'::text[],
  last_login_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Core Table: employee_history
CREATE TABLE IF NOT EXISTS public.employee_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  effective_date date NOT NULL,
  previous_value text,
  new_value text,
  designation_before text,
  designation_after text,
  department_before text,
  department_after text,
  team_before text,
  team_after text,
  region_before text,
  region_after text,
  manager_before text,
  manager_after text,
  location_before text,
  location_after text,
  created_by uuid,
  created_by_name text DEFAULT 'System Administrator',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Core Table: segments
CREATE TABLE IF NOT EXISTS public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  segment_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  target_margin_pct numeric(5, 2) DEFAULT 20.00 NOT NULL,
  lead_owner text DEFAULT 'Devika Pangam' NOT NULL,
  description text,
  active_clients_count integer DEFAULT 0,
  pipeline_value_inr numeric(15, 2) DEFAULT 0.00,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Core Table: clients & contacts
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_code text NOT NULL,
  name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  industry text NOT NULL,
  segment text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  region text DEFAULT 'West',
  tier text DEFAULT 'Tier 1 (Enterprise)',
  turnover_cr numeric(12, 2) DEFAULT 0.00,
  employees_count integer DEFAULT 0,
  status text DEFAULT 'Active',
  account_owner text,
  website text,
  address text,
  deployed_fleets jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  designation text,
  email text,
  phone text,
  is_primary boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Core Table: opportunities
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_code text NOT NULL,
  title text NOT NULL,
  client_id uuid,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  segment text DEFAULT 'Employee Transportation' NOT NULL,
  service_category text DEFAULT 'Corporate Mobility',
  contract_type text DEFAULT 'Annual Contract',
  deal_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  monthly_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  stage text DEFAULT 'Lead / Inception' NOT NULL,
  probability_pct numeric(5, 2) DEFAULT 10.00 NOT NULL,
  status text DEFAULT 'Open' NOT NULL,
  owner_name text DEFAULT 'BD Owner' NOT NULL,
  lead_source text DEFAULT 'Direct Outreach',
  expected_close_date date,
  last_activity_date date,
  next_followup_date date,
  fleet_size integer DEFAULT 0,
  vehicle_type text,
  locations text,
  competition text,
  win_probability_notes text,
  lost_reason text,
  lost_remarks text,
  internal_approvals_required boolean DEFAULT false,
  approval_status text DEFAULT 'Not Required',
  approval_remarks text,
  approved_by text,
  approved_at timestamptz,
  delegated_department text DEFAULT 'Operations',
  delegated_owner text DEFAULT 'Manish Rawat (VP - Ops)',
  delegation_status text DEFAULT 'Pending Action',
  delegation_milestone text,
  sla_days_remaining integer DEFAULT 0,
  delegation_remarks text,
  notes text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Core Table: activities
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid,
  opportunity_id uuid,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  activity_type text DEFAULT 'Physical Meeting',
  type text DEFAULT 'Physical Meeting',
  subject text,
  activity_date date DEFAULT current_date,
  activity_time text,
  conducted_by text DEFAULT 'BD Executive',
  contact_person text,
  location text,
  key_discussion text,
  outcome text,
  action_items text,
  next_followup_date date,
  status text DEFAULT 'Completed',
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Core Table: followups
CREATE TABLE IF NOT EXISTS public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid,
  opportunity_id uuid,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  due_date date DEFAULT current_date,
  assigned_to text DEFAULT 'BD Executive',
  followup_type text DEFAULT 'Call',
  type text DEFAULT 'Call',
  priority text DEFAULT 'Medium',
  description text,
  status text DEFAULT 'Pending',
  completed_at timestamptz,
  completed_date date,
  remarks text,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Core Table: internal_tasks (Approvals & Delegation Matrix)
CREATE TABLE IF NOT EXISTS public.internal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid,
  client_id uuid,
  task_code text,
  title text NOT NULL,
  department text NOT NULL,
  assigned_to text NOT NULL,
  assigned_by text DEFAULT 'System Administrator',
  due_date date NOT NULL,
  priority text DEFAULT 'Medium' NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  request_details text,
  response_notes text,
  action_date date,
  approval_remarks text,
  approved_by text,
  approved_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Core Table: documents
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid,
  opportunity_id uuid,
  name text NOT NULL,
  original_filename text NOT NULL,
  storage_path text DEFAULT '',
  document_type text NOT NULL,
  stage text DEFAULT 'Lead',
  file_size_bytes bigint DEFAULT 0,
  file_extension text DEFAULT 'pdf',
  uploaded_by uuid,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Core Tables: kra, kpi, performance (or employee_kras, employee_kpis, employee_performance_reviews)
CREATE TABLE IF NOT EXISTS public.employee_kras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  department text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  weightage_pct numeric(5, 2) DEFAULT 25.00 NOT NULL,
  score_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  status text DEFAULT 'On Track' NOT NULL,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  review_period text DEFAULT 'Annual FY26-27' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  kra_id uuid REFERENCES public.employee_kras(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  metric_type text DEFAULT 'percentage' NOT NULL,
  unit text DEFAULT '%',
  target_value numeric(15, 2) DEFAULT 100.00 NOT NULL,
  actual_value numeric(15, 2) DEFAULT 0.00 NOT NULL,
  achievement_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  weightage_pct numeric(5, 2) DEFAULT 20.00 NOT NULL,
  status text DEFAULT 'On Track' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_performance_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  quarter text DEFAULT 'Q1' NOT NULL,
  overall_score numeric(5, 2) DEFAULT 0.00 NOT NULL,
  rating_band text DEFAULT 'Meets Expectations' NOT NULL,
  status text DEFAULT 'Draft' NOT NULL,
  strengths text,
  improvements text,
  final_remarks text,
  review_date date DEFAULT current_date,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure Table Aliases / Views exist for kra, kpi, performance, approvals if queried directly
CREATE TABLE IF NOT EXISTS public.kra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid,
  department text NOT NULL,
  name text NOT NULL,
  weightage_pct numeric(5, 2) DEFAULT 25.00,
  score_pct numeric(5, 2) DEFAULT 0.00,
  status text DEFAULT 'On Track',
  financial_year text DEFAULT 'FY2026-27',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.kpi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid,
  kra_id uuid,
  title text NOT NULL,
  target_value numeric(15, 2) DEFAULT 100.00,
  actual_value numeric(15, 2) DEFAULT 0.00,
  achievement_pct numeric(5, 2) DEFAULT 0.00,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid,
  financial_year text DEFAULT 'FY2026-27',
  overall_score numeric(5, 2) DEFAULT 0.00,
  rating_band text DEFAULT 'Meets Expectations',
  status text DEFAULT 'Draft',
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid,
  task_id uuid,
  department text NOT NULL,
  approved_by text,
  approval_status text DEFAULT 'Pending',
  remarks text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Core Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Safe Alterations & Relaxation of Strict Constraints
DO $$
BEGIN
  ALTER TABLE public.activities ALTER COLUMN client_id DROP NOT NULL;
  ALTER TABLE public.activities ALTER COLUMN conducted_by TYPE text USING conducted_by::text;
  ALTER TABLE public.activities ALTER COLUMN key_discussion DROP NOT NULL;
  ALTER TABLE public.activities ALTER COLUMN outcome DROP NOT NULL;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'activities' AND column_name = 'subject') THEN
    ALTER TABLE public.activities ALTER COLUMN subject DROP NOT NULL;
  END IF;

  ALTER TABLE public.followups ALTER COLUMN client_id DROP NOT NULL;
  ALTER TABLE public.followups ALTER COLUMN assigned_to TYPE text USING assigned_to::text;
  ALTER TABLE public.followups ALTER COLUMN description DROP NOT NULL;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'followups' AND column_name = 'type') THEN
    ALTER TABLE public.followups ALTER COLUMN type DROP NOT NULL;
  END IF;

  ALTER TABLE public.opportunities ALTER COLUMN client_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Notice during schema relaxation: %', SQLERRM;
END $$;

-- 18. Add Missing Columns to Ensure Complete Frontend-Backend Alignment
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS segment_code text;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS category text DEFAULT 'Corporate Mobility';
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS target_margin_pct numeric(5, 2) DEFAULT 20.00;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS lead_owner text DEFAULT 'Devika Pangam';
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS active_clients_count integer DEFAULT 0;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS pipeline_value_inr numeric(15, 2) DEFAULT 0.00;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS opportunity_code text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'Existing Client';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS segment text DEFAULT 'Employee Transportation';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS service_category text DEFAULT 'Corporate Mobility';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS contract_type text DEFAULT 'Annual Contract';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS deal_value_inr numeric(15, 2) DEFAULT 0.00;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS monthly_value_inr numeric(15, 2) DEFAULT 0.00;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS stage text DEFAULT 'Lead / Inception';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS probability_pct numeric(5, 2) DEFAULT 10.00;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS status text DEFAULT 'Open';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS owner_name text DEFAULT 'BD Owner';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS lead_source text DEFAULT 'Direct Outreach';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS delegated_department text DEFAULT 'Operations';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS delegated_owner text DEFAULT 'Manish Rawat (VP - Ops)';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS delegation_status text DEFAULT 'Pending Action';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS delegation_milestone text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS sla_days_remaining integer DEFAULT 0;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS delegation_remarks text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_type text DEFAULT 'Physical Meeting';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS type text DEFAULT 'Physical Meeting';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'Existing Client';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS opportunity_title text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_date date DEFAULT current_date;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS activity_time text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS conducted_by text DEFAULT 'BD Executive';
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS contact_person text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS key_discussion text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS outcome text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS action_items text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS next_followup_date date;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS status text DEFAULT 'Completed';

ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS followup_type text DEFAULT 'Call';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS type text DEFAULT 'Call';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'Existing Client';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS opportunity_title text;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS due_date date DEFAULT current_date;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS assigned_to text DEFAULT 'BD Executive';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS completed_at timestamptz;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS completed_date date;
ALTER TABLE public.followups ADD COLUMN IF NOT EXISTS remarks text;

ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS task_code text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS assigned_to text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS assigned_by text DEFAULT 'System Administrator';
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS request_details text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS response_notes text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS action_date date;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS approval_remarks text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE public.internal_tasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- 19. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_dept ON public.profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_team ON public.profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON public.clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_org ON public.opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_followups_org ON public.followups(organization_id);
CREATE INDEX IF NOT EXISTS idx_internal_tasks_org ON public.internal_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_employee_history_emp ON public.employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);

-- 20. Row Level Security & Permissive Policies across all 18 Tables
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

CREATE POLICY "Organizations All" ON public.organizations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Departments All" ON public.departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Regions All" ON public.regions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Teams All" ON public.teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Profiles All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employee History All" ON public.employee_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Segments All" ON public.segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Clients All" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Contacts All" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Opportunities All" ON public.opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Activities All" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Followups All" ON public.followups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Internal Tasks All" ON public.internal_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Documents All" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employee KRAs All" ON public.employee_kras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employee KPIs All" ON public.employee_kpis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Employee Performance All" ON public.employee_performance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "KRA All" ON public.kra FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "KPI All" ON public.kpi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Performance All" ON public.performance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Approvals All" ON public.approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Audit Logs All" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 21. Grant Global Schema Permissions to all application roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 22. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
