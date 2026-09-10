-- ==============================================================================
-- CorpBD CRM — Migration: 20260910000011_final_rajmudra_department_structure.sql
-- Description: Department Master with Active/Inactive lifecycle, team department
--              filtering, and organizational hierarchy integration.
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Normalized `departments` Master Table
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. Link department_id to `teams` and `profiles`
-- ------------------------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. Trigger: Updated_at on departments
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_departments ON public.departments;
CREATE TRIGGER set_updated_at_departments
  BEFORE UPDATE ON public.departments
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Enable RLS on `departments`
-- ------------------------------------------------------------------------------
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Departments Select" ON public.departments;
CREATE POLICY "Departments Select"
  ON public.departments FOR SELECT
  USING (organization_id = public.get_current_org_id());

DROP POLICY IF EXISTS "Departments Insert" ON public.departments;
CREATE POLICY "Departments Insert"
  ON public.departments FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "Departments Update" ON public.departments;
CREATE POLICY "Departments Update"
  ON public.departments FOR UPDATE
  USING (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "Departments Delete" ON public.departments;
CREATE POLICY "Departments Delete"
  ON public.departments FOR DELETE
  USING (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- 5. Indexes for Department Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_departments_org ON public.departments(organization_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON public.departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON public.departments(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_teams_department_id ON public.teams(department_id);
CREATE INDEX IF NOT EXISTS idx_profiles_department_id ON public.profiles(department_id);

-- ------------------------------------------------------------------------------
-- 6. Seed Rajmudra Group Department Structure
--    - 6 Active Departments (BD, OPS, COP, MNT, FIN, LEG)
--    - 4 Historical Inactive Departments (HR, ADM, MGT, IT)
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  
  -- Active Department UUIDs
  v_dept_bd  uuid := '30000000-0000-0000-0000-000000000001'::uuid;
  v_dept_ops uuid := '30000000-0000-0000-0000-000000000002'::uuid;
  v_dept_cop uuid := '30000000-0000-0000-0000-000000000003'::uuid;
  v_dept_mnt uuid := '30000000-0000-0000-0000-000000000004'::uuid;
  v_dept_fin uuid := '30000000-0000-0000-0000-000000000005'::uuid;
  v_dept_leg uuid := '30000000-0000-0000-0000-000000000006'::uuid;

  -- Historical Inactive Department UUIDs (is_active = false)
  v_dept_hr  uuid := '30000000-0000-0000-0000-000000000007'::uuid;
  v_dept_adm uuid := '30000000-0000-0000-0000-000000000008'::uuid;
  v_dept_mgt uuid := '30000000-0000-0000-0000-000000000009'::uuid;
  v_dept_it  uuid := '30000000-0000-0000-0000-000000000010'::uuid;

  -- Region UUIDs
  v_reg_west    uuid := '20000000-0000-0000-0000-000000000001'::uuid;
  v_reg_north   uuid := '20000000-0000-0000-0000-000000000002'::uuid;
  v_reg_south   uuid := '20000000-0000-0000-0000-000000000003'::uuid;
  v_reg_east    uuid := '20000000-0000-0000-0000-000000000004'::uuid;
  v_reg_central uuid := '20000000-0000-0000-0000-000000000005'::uuid;
BEGIN
  -- Insert/Update Active Departments
  INSERT INTO public.departments (id, organization_id, department_name, department_code, description, is_active)
  VALUES
    (v_dept_bd,  v_org_id, 'Business Development',     'BD',  'Corporate client acquisition, RFP formulation, and revenue growth across regions.', true),
    (v_dept_ops, v_org_id, 'Operations',               'OPS', 'Fleet operations, dispatch management, driver scheduling, and route optimization.', true),
    (v_dept_cop, v_org_id, 'Centralised Operations',   'COP', 'Central Command Centre, 24/7 telematics, GPS tracking, and pan-India trip monitoring.', true),
    (v_dept_mnt, v_org_id, 'Maintenance',              'MNT', 'Fleet workshop management, preventive vehicle servicing, and asset reliability.', true),
    (v_dept_fin, v_org_id, 'Finance',                  'FIN', 'Billing, invoicing, commercial pricing calculations, receivables, and accounting.', true),
    (v_dept_leg, v_org_id, 'Legal',                    'LEG', 'Contract drafting, SLA compliance, regulatory permits, and NDA governance.', true)
  ON CONFLICT (organization_id, department_code) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

  -- Insert/Preserve Historical Inactive Departments (is_active = false)
  INSERT INTO public.departments (id, organization_id, department_name, department_code, description, is_active)
  VALUES
    (v_dept_hr,  v_org_id, 'Human Resources',          'HR',  'Personnel, recruitment, and payroll administration (Legacy / Inactive in CRM).', false),
    (v_dept_adm, v_org_id, 'Administration',           'ADM', 'General corporate administration and facility management (Legacy / Inactive in CRM).', false),
    (v_dept_mgt, v_org_id, 'Management / Corporate',   'MGT', 'Executive board and corporate leadership (Legacy / Inactive in CRM).', false),
    (v_dept_it,  v_org_id, 'IT / Technology',          'IT',  'Software systems and network infrastructure (Legacy / Inactive in CRM).', false)
  ON CONFLICT (organization_id, department_code) DO UPDATE SET
    department_name = EXCLUDED.department_name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

  -- Link Existing Teams with Department IDs and Names
  -- 1. Business Development Teams
  UPDATE public.teams
  SET department_id = v_dept_bd, department = 'BD'
  WHERE organization_id = v_org_id AND code = 'TEAM-BD-WEST';

  -- 2. Operations Teams
  UPDATE public.teams
  SET department_id = v_dept_ops, department = 'Operations'
  WHERE organization_id = v_org_id AND code = 'TEAM-OPS-FLEET';

  -- 3. Finance & Pricing Teams
  UPDATE public.teams
  SET department_id = v_dept_fin, department = 'Pricing & Commercials'
  WHERE organization_id = v_org_id AND code = 'TEAM-PRICING';

  -- 4. Legal Teams
  UPDATE public.teams
  SET department_id = v_dept_leg, department = 'Legal & Compliance'
  WHERE organization_id = v_org_id AND code = 'TEAM-LEGAL';

  -- 5. Seed Additional Department Teams for full coverage of the 6 Active Departments
  INSERT INTO public.teams (id, organization_id, name, code, department, department_id, region, region_id, annual_target_inr, description, is_active)
  VALUES
    (
      '00000000-0000-0000-0001-000000000005'::uuid,
      v_org_id,
      'Centralised Operations Command',
      'TEAM-COP-CONTROL',
      'Operations',
      v_dept_cop,
      'Central Region',
      v_reg_central,
      0.00,
      '24/7 Pan-India GPS tracking, vehicle health monitoring, and emergency SOS dispatch.',
      true
    ),
    (
      '00000000-0000-0000-0001-000000000006'::uuid,
      v_org_id,
      'Fleet Maintenance & Workshop Engineering',
      'TEAM-MNT-WORKSHOP',
      'Fleet / Asset Management',
      v_dept_mnt,
      'West Region',
      v_reg_west,
      0.00,
      'Preventive fleet maintenance, depot servicing, tire management, and workshop repairs.',
      true
    ),
    (
      '00000000-0000-0000-0001-000000000007'::uuid,
      v_org_id,
      'Corporate Finance & Client Invoicing',
      'TEAM-FIN-ACCOUNTS',
      'Finance & Accounts',
      v_dept_fin,
      'West Region',
      v_reg_west,
      0.00,
      'Monthly corporate fleet billing, credit control, accounts payable, and tax compliance.',
      true
    )
  ON CONFLICT (organization_id, code) DO UPDATE SET
    department_id = EXCLUDED.department_id,
    region_id = EXCLUDED.region_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

END $$;
