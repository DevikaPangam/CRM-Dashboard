-- ==============================================================================
-- CorpBD CRM — MASTER PRODUCTION DATABASE & PROFILES SCHEMA MIGRATION
-- Project: Rajmudra Group Multi-Tenant Architecture
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Enable Core Cryptographic and UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumeration Types
DO $$ BEGIN
  CREATE TYPE public.user_role_enum AS ENUM (
    'super_admin',
    'bd_director',
    'bd_manager',
    'bd_sr_exec',
    'bd_exec',
    'operations_manager',
    'cops_supervisor',
    'maintenance_engineer',
    'finance_executive',
    'legal_counsel',
    'management_viewer',
    'analyst'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_status_enum AS ENUM (
    'active',
    'inactive',
    'suspended',
    'invited'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Core Relational Tables

-- Table 1: organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  legal_entity_name text,
  gstin text,
  cin text,
  primary_domain text DEFAULT 'rajmudragroup.com',
  logo_url text,
  is_active boolean DEFAULT true NOT NULL,
  subscription_tier text DEFAULT 'enterprise' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 2: departments
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
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

-- Table 3: regions
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  regional_head_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_region_code UNIQUE (organization_id, code),
  CONSTRAINT uq_org_region_name UNIQUE (organization_id, name)
);

-- Table 4: teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  name text NOT NULL,
  code text NOT NULL,
  department text DEFAULT 'Business Development',
  region text DEFAULT 'West Region',
  annual_target_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  description text,
  leader_id uuid,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_team_code UNIQUE (organization_id, code)
);

-- Table 5: profiles (Single Source of Truth for all employees, linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE RESTRICT NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role public.user_role_enum DEFAULT 'bd_exec' NOT NULL,
  department text DEFAULT 'Business Development' NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  designation text,
  employee_id text,
  phone text,
  avatar_url text,
  avatar_bg text DEFAULT '#3b82f6',
  region text DEFAULT 'West',
  region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL,
  location text DEFAULT 'Corporate HQ - Mumbai',
  joining_date date,
  employment_type text DEFAULT 'Full-time',
  is_regional_owner boolean DEFAULT false,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.user_status_enum DEFAULT 'active' NOT NULL,
  annual_target_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 6: employee_history (Career Trajectory & Historical Milestones)
CREATE TABLE IF NOT EXISTS public.employee_history (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  effective_date date NOT NULL,
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_state jsonb,
  new_state jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 7: employee_kras & employee_kpis
CREATE TABLE IF NOT EXISTS public.employee_kras (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  period text DEFAULT 'Annual FY26-27' NOT NULL,
  department text NOT NULL,
  title text NOT NULL,
  description text,
  weight_pct numeric(5, 2) DEFAULT 25.00 NOT NULL,
  target_metric text NOT NULL,
  achieved_metric text DEFAULT '0',
  score_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  status text DEFAULT 'On Track' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.employee_kpis (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  kra_id uuid REFERENCES public.employee_kras(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  metric_name text NOT NULL,
  unit text NOT NULL,
  target_value numeric(15, 2) NOT NULL,
  actual_value numeric(15, 2) DEFAULT 0.00 NOT NULL,
  weight_pct numeric(5, 2) DEFAULT 100.00 NOT NULL,
  score_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  status text DEFAULT 'On Track' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpis ENABLE ROW LEVEL SECURITY;

-- 5. Helper Security Functions
CREATE OR REPLACE FUNCTION public.get_current_org_id()
RETURNS uuid AS $$
  SELECT coalesce(
    (SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1),
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_org_admin()
RETURNS boolean AS $$
  SELECT exists (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role in ('super_admin', 'bd_director')
  ) OR auth.uid() IS NULL;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. RLS Policies for Profiles
DROP POLICY IF EXISTS "Profiles Select Policy" ON public.profiles;
CREATE POLICY "Profiles Select Policy"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Profiles Insert Policy" ON public.profiles;
CREATE POLICY "Profiles Insert Policy"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles Update Policy" ON public.profiles;
CREATE POLICY "Profiles Update Policy"
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Profiles Delete Policy" ON public.profiles;
CREATE POLICY "Profiles Delete Policy"
  ON public.profiles FOR DELETE
  USING (true);

-- RLS Policies for Organizations, Departments, Regions, Teams, History
DROP POLICY IF EXISTS "Organizations All" ON public.organizations;
CREATE POLICY "Organizations All" ON public.organizations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Departments All" ON public.departments;
CREATE POLICY "Departments All" ON public.departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Regions All" ON public.regions;
CREATE POLICY "Regions All" ON public.regions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teams All" ON public.teams;
CREATE POLICY "Teams All" ON public.teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Employee History All" ON public.employee_history;
CREATE POLICY "Employee History All" ON public.employee_history FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Employee KRAs All" ON public.employee_kras;
CREATE POLICY "Employee KRAs All" ON public.employee_kras FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Employee KPIs All" ON public.employee_kpis;
CREATE POLICY "Employee KPIs All" ON public.employee_kpis FOR ALL USING (true) WITH CHECK (true);

-- 7. Seed Primary Tenant (Rajmudra Group) & Canonical Hierarchy
INSERT INTO public.organizations (id, name, slug, legal_entity_name, primary_domain, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rajmudra Group',
  'rajmudra-group',
  'Rajmudra Fleet & Corporate Services Pvt Ltd',
  'rajmudragroup.com',
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Active Departments
INSERT INTO public.departments (id, organization_id, department_name, department_code, description, is_active)
VALUES 
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Business Development', 'BD', 'Corporate client acquisition and growth', true),
  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Operations', 'OPS', 'Fleet operations and route management', true),
  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Centralised Operations', 'COP', 'Central Command Centre and pan-India telematics', true),
  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Maintenance', 'MNT', 'Fleet workshop and preventive maintenance', true),
  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Finance', 'FIN', 'Billing, commercial pricing, and accounting', true),
  ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Legal', 'LEG', 'Contract drafting, SLA compliance, and governance', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Regions
INSERT INTO public.regions (id, organization_id, name, code, description, is_active)
VALUES
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'West Region', 'REG-WEST', 'Maharashtra, Gujarat & Goa Hub', true),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'North Region', 'REG-NORTH', 'Delhi NCR, Haryana, Punjab & UP Hub', true),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'South Region', 'REG-SOUTH', 'Karnataka, Tamil Nadu & Telangana Corridor', true),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'East Region', 'REG-EAST', 'West Bengal, Odisha & Port Logistics', true),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Central Region', 'REG-CENTRAL', 'Madhya Pradesh & Chhattisgarh Multi-Modal Hub', true)
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Super Admin Profile (Devika Pangam)
INSERT INTO public.profiles (
  id,
  organization_id,
  full_name,
  email,
  role,
  department,
  department_id,
  designation,
  employee_id,
  region,
  region_id,
  location,
  joining_date,
  employment_type,
  is_regional_owner,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Devika Pangam',
  'devika.p@rajmudragroup.com',
  'super_admin',
  'Executive Management',
  '30000000-0000-0000-0000-000000000001',
  'Managing Director & System Administrator',
  'EMP-DIR-001',
  'West Region',
  '20000000-0000-0000-0000-000000000001',
  'Corporate HQ - Mumbai',
  '2024-01-01',
  'Full-time',
  true,
  'active'
) ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- 8. Explicitly Notify PostgREST to Reload Schema Cache
NOTIFY pgrst, 'reload schema';
