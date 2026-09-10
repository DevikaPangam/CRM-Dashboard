-- ==============================================================================
-- CorpBD CRM — Migration: 20260910000010_employee_career_trajectory.sql
-- Description: Employee Career Trajectory, Historical State Tracking & Automated Timeline
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ==============================================================================

-- 1. Create Enum for Employee History Event Types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'employee_event_type_enum') THEN
    CREATE TYPE public.employee_event_type_enum AS ENUM (
      'joining',
      'promotion',
      'designation_change',
      'department_change',
      'team_change',
      'region_change',
      'manager_change',
      'location_change',
      'responsibility_change',
      'achievement',
      'award',
      'training',
      'certification',
      'other'
    );
  END IF;
END $$;

-- 2. Create employee_history Table
CREATE TABLE IF NOT EXISTS public.employee_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type public.employee_event_type_enum NOT NULL DEFAULT 'other',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  description TEXT,
  previous_value JSONB DEFAULT '{}'::jsonb,
  new_value JSONB DEFAULT '{}'::jsonb,
  designation_before TEXT,
  designation_after TEXT,
  department_before TEXT,
  department_after TEXT,
  team_before TEXT,
  team_after TEXT,
  region_before TEXT,
  region_after TEXT,
  manager_before TEXT,
  manager_after TEXT,
  location_before TEXT,
  location_after TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Indexes for High-Performance Chronological & Search Queries
CREATE INDEX IF NOT EXISTS idx_emp_history_employee_id ON public.employee_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_history_org_id ON public.employee_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_emp_history_effective_date ON public.employee_history(effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_emp_history_event_type ON public.employee_history(event_type);

-- 4. Enable Row-Level Security (RLS)
ALTER TABLE public.employee_history ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "employee_history_select_policy" ON public.employee_history;
CREATE POLICY "employee_history_select_policy"
  ON public.employee_history
  FOR SELECT
  USING (
    organization_id = public.get_current_org_id()
    AND (
      public.is_org_admin()
      OR public.has_module_access('team')
      OR employee_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = employee_history.employee_id
          AND p.manager_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "employee_history_insert_policy" ON public.employee_history;
CREATE POLICY "employee_history_insert_policy"
  ON public.employee_history
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND (
      public.is_org_admin()
      OR public.current_user_has_role(ARRAY['bd_director', 'bd_manager']::public.user_role_enum[])
    )
  );

DROP POLICY IF EXISTS "employee_history_update_policy" ON public.employee_history;
CREATE POLICY "employee_history_update_policy"
  ON public.employee_history
  FOR UPDATE
  USING (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.is_org_admin()
  );

-- 6. Trigger: Automated Profile History Recording
CREATE OR REPLACE FUNCTION public.auto_record_profile_history()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_actor_id UUID;
  v_actor_name TEXT;
  v_team_before_name TEXT;
  v_team_after_name TEXT;
  v_mgr_before_name TEXT;
  v_mgr_after_name TEXT;
BEGIN
  v_org_id := NEW.organization_id;
  v_actor_id := auth.uid();

  SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = v_actor_id;
  IF v_actor_name IS NULL THEN
    v_actor_name := 'System Administrator';
  END IF;

  -- 1. Check Designation Change / Promotion
  IF OLD.designation IS DISTINCT FROM NEW.designation THEN
    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, designation_before, designation_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'designation_change', CURRENT_DATE,
      'Designation Updated to ' || COALESCE(NEW.designation, 'N/A'),
      'Employee designation transitioned from ' || COALESCE(OLD.designation, 'N/A') || ' to ' || COALESCE(NEW.designation, 'N/A'),
      OLD.designation, NEW.designation,
      jsonb_build_object('designation', OLD.designation),
      jsonb_build_object('designation', NEW.designation),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 2. Check Department Change
  IF OLD.department IS DISTINCT FROM NEW.department THEN
    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, department_before, department_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'department_change', CURRENT_DATE,
      'Department Changed to ' || COALESCE(NEW.department, 'N/A'),
      'Transferred from ' || COALESCE(OLD.department, 'N/A') || ' to ' || COALESCE(NEW.department, 'N/A'),
      OLD.department, NEW.department,
      jsonb_build_object('department', OLD.department),
      jsonb_build_object('department', NEW.department),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 3. Check Team Change
  IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
    SELECT name INTO v_team_before_name FROM public.teams WHERE id = OLD.team_id;
    SELECT name INTO v_team_after_name FROM public.teams WHERE id = NEW.team_id;

    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, team_before, team_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'team_change', CURRENT_DATE,
      'Team Reassigned to ' || COALESCE(v_team_after_name, 'Unassigned'),
      'Reassigned from ' || COALESCE(v_team_before_name, 'None') || ' to ' || COALESCE(v_team_after_name, 'None'),
      v_team_before_name, v_team_after_name,
      jsonb_build_object('team_id', OLD.team_id, 'team_name', v_team_before_name),
      jsonb_build_object('team_id', NEW.team_id, 'team_name', v_team_after_name),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 4. Check Region Change
  IF OLD.region IS DISTINCT FROM NEW.region THEN
    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, region_before, region_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'region_change', CURRENT_DATE,
      'Territory Transferred to ' || COALESCE(NEW.region, 'N/A'),
      'Regional territory assignment transferred from ' || COALESCE(OLD.region, 'N/A') || ' to ' || COALESCE(NEW.region, 'N/A'),
      OLD.region, NEW.region,
      jsonb_build_object('region', OLD.region),
      jsonb_build_object('region', NEW.region),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 5. Check Manager Change
  IF OLD.manager_id IS DISTINCT FROM NEW.manager_id THEN
    SELECT full_name INTO v_mgr_before_name FROM public.profiles WHERE id = OLD.manager_id;
    SELECT full_name INTO v_mgr_after_name FROM public.profiles WHERE id = NEW.manager_id;

    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, manager_before, manager_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'manager_change', CURRENT_DATE,
      'Reporting Manager Reassigned to ' || COALESCE(v_mgr_after_name, 'Direct'),
      'Reporting line changed from ' || COALESCE(v_mgr_before_name, 'None') || ' to ' || COALESCE(v_mgr_after_name, 'None'),
      v_mgr_before_name, v_mgr_after_name,
      jsonb_build_object('manager_id', OLD.manager_id, 'manager_name', v_mgr_before_name),
      jsonb_build_object('manager_id', NEW.manager_id, 'manager_name', v_mgr_after_name),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 6. Check Location Change
  IF OLD.location IS DISTINCT FROM NEW.location THEN
    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description, location_before, location_after,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'location_change', CURRENT_DATE,
      'Base Location Changed to ' || COALESCE(NEW.location, 'N/A'),
      'Base location updated from ' || COALESCE(OLD.location, 'N/A') || ' to ' || COALESCE(NEW.location, 'N/A'),
      OLD.location, NEW.location,
      jsonb_build_object('location', OLD.location),
      jsonb_build_object('location', NEW.location),
      v_actor_id, v_actor_name
    );
  END IF;

  -- 7. Check Responsibility / Regional Owner Change
  IF OLD.is_regional_owner IS DISTINCT FROM NEW.is_regional_owner THEN
    INSERT INTO public.employee_history (
      employee_id, organization_id, event_type, effective_date,
      title, description,
      previous_value, new_value, created_by, created_by_name
    ) VALUES (
      NEW.id, v_org_id, 'responsibility_change', CURRENT_DATE,
      CASE WHEN NEW.is_regional_owner THEN 'Designated as Regional Territory Owner' ELSE 'Regional Owner Responsibility Relinquished' END,
      CASE WHEN NEW.is_regional_owner 
        THEN 'Appointed as Regional Territory Head for ' || COALESCE(NEW.region, 'Assigned Region')
        ELSE 'Regional Owner status removed for ' || COALESCE(OLD.region, 'Assigned Region')
      END,
      jsonb_build_object('is_regional_owner', OLD.is_regional_owner),
      jsonb_build_object('is_regional_owner', NEW.is_regional_owner),
      v_actor_id, v_actor_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.profiles
DROP TRIGGER IF EXISTS trg_auto_record_profile_history ON public.profiles;
CREATE TRIGGER trg_auto_record_profile_history
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_record_profile_history();

-- 7. Backfill Canonical Joining Events for existing employees
INSERT INTO public.employee_history (
  employee_id, organization_id, event_type, effective_date,
  title, description, designation_after, department_after,
  team_after, region_after, location_after, created_by_name
)
SELECT 
  p.id,
  p.organization_id,
  'joining'::public.employee_event_type_enum,
  COALESCE(p.joining_date, '2024-04-01'::date),
  'Joined Rajmudra Group',
  'Inducted into ' || COALESCE(p.department, 'Business Development') || ' as ' || COALESCE(p.designation, 'BD Executive'),
  p.designation,
  p.department,
  t.name,
  p.region,
  p.location,
  'HR Onboarding'
FROM public.profiles p
LEFT JOIN public.teams t ON t.id = p.team_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.employee_history h 
  WHERE h.employee_id = p.id AND h.event_type = 'joining'
);
