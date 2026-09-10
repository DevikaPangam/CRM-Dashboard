-- ==============================================================================
-- CorpBD CRM — Migration: 20260910000008_unified_employee_profile_foundation.sql
-- Description: Unifies employee profile foundation on public.profiles as the
--              single source of truth for all users, BD team members, and regional owners.
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ==============================================================================

-- 1. Add Unified Employee Foundation Columns to public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS region text DEFAULT 'West',
  ADD COLUMN IF NOT EXISTS joining_date date,
  ADD COLUMN IF NOT EXISTS location text DEFAULT 'Corporate HQ - Mumbai',
  ADD COLUMN IF NOT EXISTS employment_type text DEFAULT 'Full-time',
  ADD COLUMN IF NOT EXISTS is_regional_owner boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS avatar_bg text DEFAULT '#3b82f6';

-- 2. Add validation constraint for employment_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_profile_employment_type' 
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
      ADD CONSTRAINT chk_profile_employment_type 
      CHECK (employment_type IN ('Full-time', 'Contract', 'Probation', 'Part-time'));
  END IF;
END $$;

-- 3. Indexes for fast lookup on Regional Owners, Region, and Tenure
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_regional_owner ON public.profiles(is_regional_owner);
CREATE INDEX IF NOT EXISTS idx_profiles_joining_date ON public.profiles(joining_date);
CREATE INDEX IF NOT EXISTS idx_profiles_emp_id ON public.profiles(employee_id);

-- 4. Update Security Trigger: prevent_profile_self_escalation
CREATE OR REPLACE FUNCTION public.prevent_profile_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If not an organization admin, block modifications to privileged administrative fields
  IF NOT public.is_org_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can modify user roles.';
    END IF;
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id THEN
      RAISE EXCEPTION 'Unauthorized: Users cannot change their organization.';
    END IF;
    IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can reassign teams.';
    END IF;
    IF NEW.manager_id IS DISTINCT FROM OLD.manager_id THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can assign managers.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can modify account status.';
    END IF;
    IF NEW.annual_target_inr IS DISTINCT FROM OLD.annual_target_inr THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can modify target quotas.';
    END IF;
    IF NEW.allowed_segments IS DISTINCT FROM OLD.allowed_segments THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can modify segment permissions.';
    END IF;
    IF NEW.is_regional_owner IS DISTINCT FROM OLD.is_regional_owner THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can designate Regional Ownership.';
    END IF;
    IF NEW.joining_date IS DISTINCT FROM OLD.joining_date THEN
      RAISE EXCEPTION 'Unauthorized: Only an Administrator can modify employee joining dates.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Seed default values for existing profiles in Rajmudra Group
UPDATE public.profiles
SET 
  employee_id = COALESCE(employee_id, 'EMP-001'),
  region = COALESCE(region, 'All Corporate Business Segments & Regions'),
  joining_date = COALESCE(joining_date, '2020-04-01'::date),
  location = COALESCE(location, 'Corporate HQ - Mumbai'),
  employment_type = COALESCE(employment_type, 'Full-time'),
  is_regional_owner = COALESCE(is_regional_owner, true),
  annual_target_inr = CASE WHEN annual_target_inr = 0 THEN 265000000.00 ELSE annual_target_inr END,
  avatar_bg = COALESCE(avatar_bg, '#f59e0b')
WHERE email = 'devika.p@rajmudragroup.com';
