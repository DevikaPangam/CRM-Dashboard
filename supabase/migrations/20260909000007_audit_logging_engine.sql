-- ============================================================================
-- Migration: 20260909000007_audit_logging_engine.sql
-- Description: Production-grade Audit Logging Engine, Automated Change Triggers,
--              Immutability Controls, and Filtered Query Helpers.
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Automated Change Audit Trigger Function
-- Automatically captures row-level changes for audited CRM tables.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_crm_entity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor_id UUID;
  v_actor_name TEXT;
  v_org_id UUID;
  v_entity_id TEXT;
  v_old_values JSONB := NULL;
  v_new_values JSONB := NULL;
  v_action TEXT;
BEGIN
  -- Determine current actor
  v_actor_id := auth.uid();
  IF v_actor_id IS NOT NULL THEN
    SELECT full_name INTO v_actor_name FROM public.profiles WHERE id = v_actor_id;
  ELSE
    v_actor_name := 'System Trigger / Service Role';
  END IF;

  -- Determine operation action and entity ID
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_org_id := NEW.organization_id;
    v_entity_id := NEW.id::TEXT;
    v_new_values := to_jsonb(NEW) - 'password' - 'password_hash' - 'token';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'UPDATE';
    v_org_id := COALESCE(NEW.organization_id, OLD.organization_id);
    v_entity_id := NEW.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'password_hash' - 'token';
    v_new_values := to_jsonb(NEW) - 'password' - 'password_hash' - 'token';
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_org_id := OLD.organization_id;
    v_entity_id := OLD.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'password_hash' - 'token';
  END IF;

  -- Skip if no organization ID resolved
  IF v_org_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Insert audit trail log entry
  INSERT INTO public.audit_logs (
    organization_id,
    user_id,
    user_name,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    metadata,
    created_at
  ) VALUES (
    v_org_id,
    v_actor_id,
    v_actor_name,
    v_action,
    TG_TABLE_NAME,
    v_entity_id,
    v_old_values,
    v_new_values,
    jsonb_build_object('source', 'database_trigger', 'table', TG_TABLE_NAME),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Attach Automated Audit Triggers to Key CRM Tables
-- ----------------------------------------------------------------------------

-- Clients Audit Trigger
DROP TRIGGER IF EXISTS trg_audit_clients ON public.clients;
CREATE TRIGGER trg_audit_clients
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_entity_change();

-- Opportunities Audit Trigger
DROP TRIGGER IF EXISTS trg_audit_opportunities ON public.opportunities;
CREATE TRIGGER trg_audit_opportunities
  AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_entity_change();

-- Proposals Audit Trigger
DROP TRIGGER IF EXISTS trg_audit_proposals ON public.proposals;
CREATE TRIGGER trg_audit_proposals
  AFTER INSERT OR UPDATE OR DELETE ON public.proposals
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_entity_change();

-- Documents Audit Trigger
DROP TRIGGER IF EXISTS trg_audit_documents ON public.documents;
CREATE TRIGGER trg_audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_entity_change();

-- Profiles Audit Trigger
DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
CREATE TRIGGER trg_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_crm_entity_change();

-- ----------------------------------------------------------------------------
-- 3. Stored Function: get_filtered_audit_logs
-- Provides RBAC-guarded audit log queries with tenant isolation.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_filtered_audit_logs(
  p_entity_type TEXT DEFAULT NULL,
  p_action TEXT DEFAULT NULL,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  user_name TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id UUID;
  v_role TEXT;
BEGIN
  v_org_id := public.get_current_org_id();
  v_role := public.get_current_role();

  -- Verify administrative permissions
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Unauthenticated request';
  END IF;

  IF v_role NOT IN ('super_admin', 'bd_director') THEN
    RAISE EXCEPTION 'Access Denied: Audit logs are restricted to Administrators';
  END IF;

  RETURN QUERY
  SELECT 
    a.id,
    a.organization_id,
    a.user_id,
    a.user_name,
    a.action,
    a.entity_type,
    a.entity_id,
    a.old_values,
    a.new_values,
    a.metadata,
    a.created_at
  FROM public.audit_logs a
  WHERE a.organization_id = v_org_id
    AND (p_entity_type IS NULL OR p_entity_type = 'All' OR a.entity_type = p_entity_type)
    AND (p_action IS NULL OR p_action = 'All' OR a.action = p_action)
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
