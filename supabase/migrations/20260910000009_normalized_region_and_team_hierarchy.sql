-- ==============================================================================
-- CorpBD CRM — Migration: 20260910000009_normalized_region_and_team_hierarchy.sql
-- Description: Normalized Region structure and strict organizational hierarchy
--              Organization → Department → Region → Team → Manager → Employee
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Normalized `regions` Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  description text,
  regional_head_id uuid, -- Reference to profiles(id) added below
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_region_code UNIQUE (organization_id, code),
  CONSTRAINT uq_org_region_name UNIQUE (organization_id, name)
);

-- ------------------------------------------------------------------------------
-- 2. Link region_id Foreign Keys to `teams` and `profiles`
-- ------------------------------------------------------------------------------
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.regions(id) ON DELETE SET NULL;

-- Link regional_head reference
ALTER TABLE public.regions
  DROP CONSTRAINT IF EXISTS fk_region_head,
  ADD CONSTRAINT fk_region_head FOREIGN KEY (regional_head_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ------------------------------------------------------------------------------
-- 3. Trigger: Updated_at on regions
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_regions ON public.regions;
CREATE TRIGGER set_updated_at_regions
  BEFORE UPDATE ON public.regions
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

-- ------------------------------------------------------------------------------
-- 4. Enhanced Hierarchy & Self-Management Integrity Trigger on `profiles`
-- Enforces:
-- (a) Employee cannot assign themselves as their own manager.
-- (b) Manager must belong to the exact same organization.
-- (c) Team must belong to the exact same organization.
-- (d) Region must belong to the exact same organization.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_profile_hierarchy_integrity()
RETURNS TRIGGER AS $$
DECLARE
  mgr_org_id uuid;
  team_org_id uuid;
  region_org_id uuid;
BEGIN
  -- 1. Prevent self-assignment as manager
  IF NEW.manager_id IS NOT NULL AND NEW.manager_id = NEW.id THEN
    RAISE EXCEPTION 'Hierarchy Integrity Violation: An employee cannot be assigned as their own reporting manager (User ID: %).', NEW.id;
  END IF;

  -- 2. Ensure manager belongs to the identical organization
  IF NEW.manager_id IS NOT NULL THEN
    SELECT organization_id INTO mgr_org_id FROM public.profiles WHERE id = NEW.manager_id;
    IF mgr_org_id IS NULL THEN
      RAISE EXCEPTION 'Hierarchy Integrity Violation: Manager ID % does not exist.', NEW.manager_id;
    END IF;
    IF mgr_org_id IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'Cross-Organization Violation: Manager (ID %) belongs to organization %, but user is in organization %',
        NEW.manager_id, mgr_org_id, NEW.organization_id;
    END IF;
  END IF;

  -- 3. Ensure team belongs to the identical organization
  IF NEW.team_id IS NOT NULL THEN
    SELECT organization_id INTO team_org_id FROM public.teams WHERE id = NEW.team_id;
    IF team_org_id IS NULL THEN
      RAISE EXCEPTION 'Hierarchy Integrity Violation: Team ID % does not exist.', NEW.team_id;
    END IF;
    IF team_org_id IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'Cross-Organization Violation: Team (ID %) belongs to organization %, but user is in organization %',
        NEW.team_id, team_org_id, NEW.organization_id;
    END IF;
  END IF;

  -- 4. Ensure region belongs to the identical organization
  IF NEW.region_id IS NOT NULL THEN
    SELECT organization_id INTO region_org_id FROM public.regions WHERE id = NEW.region_id;
    IF region_org_id IS NULL THEN
      RAISE EXCEPTION 'Hierarchy Integrity Violation: Region ID % does not exist.', NEW.region_id;
    END IF;
    IF region_org_id IS DISTINCT FROM NEW.organization_id THEN
      RAISE EXCEPTION 'Cross-Organization Violation: Region (ID %) belongs to organization %, but user is in organization %',
        NEW.region_id, region_org_id, NEW.organization_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_check_profile_hierarchy ON public.profiles;
CREATE TRIGGER trg_check_profile_hierarchy
  BEFORE INSERT OR UPDATE OF manager_id, team_id, region_id, organization_id ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.check_profile_hierarchy_integrity();

-- ------------------------------------------------------------------------------
-- 5. Enable RLS on `regions` and Define Organization-Scoped Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Regions Select" ON public.regions;
CREATE POLICY "Regions Select"
  ON public.regions FOR SELECT
  USING (organization_id = public.get_current_org_id());

DROP POLICY IF EXISTS "Regions Insert" ON public.regions;
CREATE POLICY "Regions Insert"
  ON public.regions FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "Regions Update" ON public.regions;
CREATE POLICY "Regions Update"
  ON public.regions FOR UPDATE
  USING (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

DROP POLICY IF EXISTS "Regions Delete" ON public.regions;
CREATE POLICY "Regions Delete"
  ON public.regions FOR DELETE
  USING (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. Indexes for Region & Team Hierarchy
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_regions_org ON public.regions(organization_id);
CREATE INDEX IF NOT EXISTS idx_regions_code ON public.regions(code);
CREATE INDEX IF NOT EXISTS idx_regions_head ON public.regions(regional_head_id);
CREATE INDEX IF NOT EXISTS idx_teams_region ON public.teams(region_id);
CREATE INDEX IF NOT EXISTS idx_profiles_region_id ON public.profiles(region_id);

-- ------------------------------------------------------------------------------
-- 7. Seed Normalized Regions for Rajmudra Group
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_org_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_reg_west uuid := '20000000-0000-0000-0000-000000000001'::uuid;
  v_reg_north uuid := '20000000-0000-0000-0000-000000000002'::uuid;
  v_reg_south uuid := '20000000-0000-0000-0000-000000000003'::uuid;
  v_reg_east uuid := '20000000-0000-0000-0000-000000000004'::uuid;
  v_reg_central uuid := '20000000-0000-0000-0000-000000000005'::uuid;
BEGIN
  -- Insert Normalized Regions
  INSERT INTO public.regions (id, organization_id, name, code, description, is_active)
  VALUES
    (v_reg_west, v_org_id, 'West Region', 'REG-WEST', 'Maharashtra, Gujarat & Goa (Corporate HQ & Core Fleet Operations)', true),
    (v_reg_north, v_org_id, 'North Region', 'REG-NORTH', 'Delhi NCR, Haryana, Punjab, Rajasthan & UP Hub', true),
    (v_reg_south, v_org_id, 'South Region', 'REG-SOUTH', 'Karnataka, Tamil Nadu, Telangana & Kerala Corridor', true),
    (v_reg_east, v_org_id, 'East Region', 'REG-EAST', 'West Bengal, Odisha, Bihar & Port Logistics Corridor', true),
    (v_reg_central, v_org_id, 'Central Region', 'REG-CENTRAL', 'Madhya Pradesh & Chhattisgarh Multi-Modal Hub', true)
  ON CONFLICT (organization_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

  -- Link West region to existing West BD team
  UPDATE public.teams
  SET region_id = v_reg_west
  WHERE organization_id = v_org_id AND code = 'TEAM-BD-WEST';

  -- Link Central region to Pricing & Legal teams
  UPDATE public.teams
  SET region_id = v_reg_central
  WHERE organization_id = v_org_id AND code IN ('TEAM-PRICING', 'TEAM-LEGAL');

  -- Link West region to Fleet Ops
  UPDATE public.teams
  SET region_id = v_reg_west
  WHERE organization_id = v_org_id AND code = 'TEAM-OPS-FLEET';

  -- Link West region to existing super_admin profile
  UPDATE public.profiles
  SET 
    region_id = v_reg_west,
    region = 'West Region'
  WHERE organization_id = v_org_id AND email = 'devika.p@rajmudragroup.com';

END $$;
