-- Migration: 20260920000001_restrict_career_trajectory_to_super_admin.sql
-- Enforces strict RBAC requirement: Only super_admin can add, edit, or delete Career Trajectory.

DROP POLICY IF EXISTS "employee_history_insert_policy" ON public.employee_history;
CREATE POLICY "employee_history_insert_policy"
  ON public.employee_history
  FOR INSERT
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.get_current_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "employee_history_update_policy" ON public.employee_history;
CREATE POLICY "employee_history_update_policy"
  ON public.employee_history
  FOR UPDATE
  USING (
    organization_id = public.get_current_org_id()
    AND public.get_current_role() = 'super_admin'
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND public.get_current_role() = 'super_admin'
  );

DROP POLICY IF EXISTS "employee_history_delete_policy" ON public.employee_history;
CREATE POLICY "employee_history_delete_policy"
  ON public.employee_history
  FOR DELETE
  USING (
    organization_id = public.get_current_org_id()
    AND public.get_current_role() = 'super_admin'
  );
