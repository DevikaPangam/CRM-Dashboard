-- ============================================================================
-- Migration: 20260909000006_reporting_and_dashboard_metrics.sql
-- Description: Production-grade database aggregation functions and RPCs for
--              Executive Dashboard, MMR Reporting, and Performance Analytics.
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Index Enhancements for Aggregation Queries
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_opportunities_metrics_comp 
  ON public.opportunities (organization_id, status, stage, deal_value_inr);

CREATE INDEX IF NOT EXISTS idx_followups_metrics_comp 
  ON public.followups (organization_id, status, due_date);

CREATE INDEX IF NOT EXISTS idx_activities_metrics_comp 
  ON public.activities (organization_id, created_at);

CREATE INDEX IF NOT EXISTS idx_proposals_metrics_comp 
  ON public.proposals (organization_id, status, final_price_inr);

-- ----------------------------------------------------------------------------
-- 2. Stored Function: get_executive_dashboard_metrics
-- Aggregates organization-wide KPIs securely at the database level.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_executive_dashboard_metrics(target_org_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id UUID;
  v_result JSONB;
BEGIN
  -- Determine effective organization ID
  IF target_org_id IS NOT NULL THEN
    v_org_id := target_org_id;
  ELSE
    v_org_id := public.get_current_org_id();
  END IF;

  -- Ensure valid organization context
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization context missing or unauthenticated';
  END IF;

  -- Verify caller belongs to the target organization
  IF target_org_id IS NOT NULL AND target_org_id <> public.get_current_org_id() THEN
    RAISE EXCEPTION 'Access Denied: Cross-organization metrics aggregation is prohibited';
  END IF;

  -- Aggregate metrics using JSON build object
  SELECT jsonb_build_object(
    'organization_id', v_org_id,
    'total_clients', (
      SELECT COUNT(*)::INT 
      FROM public.clients 
      WHERE organization_id = v_org_id AND deleted_at IS NULL
    ),
    'active_clients', (
      SELECT COUNT(*)::INT 
      FROM public.clients 
      WHERE organization_id = v_org_id AND status = 'active' AND deleted_at IS NULL
    ),
    'total_opportunities', (
      SELECT COUNT(*)::INT 
      FROM public.opportunities 
      WHERE organization_id = v_org_id AND deleted_at IS NULL
    ),
    'active_opportunities', (
      SELECT COUNT(*)::INT 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status NOT IN ('won', 'lost') 
        AND deleted_at IS NULL
    ),
    'pipeline_value_inr', (
      SELECT COALESCE(SUM(deal_value_inr), 0) 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status NOT IN ('won', 'lost') 
        AND deleted_at IS NULL
    ),
    'weighted_pipeline_inr', (
      SELECT COALESCE(SUM((deal_value_inr * probability) / 100.0), 0) 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status NOT IN ('won', 'lost') 
        AND deleted_at IS NULL
    ),
    'won_opportunities', (
      SELECT COUNT(*)::INT 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status = 'won' 
        AND deleted_at IS NULL
    ),
    'won_revenue_inr', (
      SELECT COALESCE(SUM(deal_value_inr), 0) 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status = 'won' 
        AND deleted_at IS NULL
    ),
    'lost_opportunities', (
      SELECT COUNT(*)::INT 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status = 'lost' 
        AND deleted_at IS NULL
    ),
    'closed_count', (
      SELECT COUNT(*)::INT 
      FROM public.opportunities 
      WHERE organization_id = v_org_id 
        AND status IN ('won', 'lost') 
        AND deleted_at IS NULL
    ),
    'win_rate_pct', (
      SELECT CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('won', 'lost')) > 0 
        THEN ROUND((COUNT(*) FILTER (WHERE status = 'won')::NUMERIC / COUNT(*) FILTER (WHERE status IN ('won', 'lost'))::NUMERIC) * 100, 1)
        ELSE 0 
      END
      FROM public.opportunities 
      WHERE organization_id = v_org_id AND deleted_at IS NULL
    ),
    'activity_volume_30d', (
      SELECT COUNT(*)::INT 
      FROM public.activities 
      WHERE organization_id = v_org_id 
        AND created_at >= (NOW() - INTERVAL '30 days')
    ),
    'overdue_followups', (
      SELECT COUNT(*)::INT 
      FROM public.followups 
      WHERE organization_id = v_org_id 
        AND status <> 'completed' 
        AND due_date < CURRENT_DATE
    ),
    'upcoming_followups', (
      SELECT COUNT(*)::INT 
      FROM public.followups 
      WHERE organization_id = v_org_id 
        AND status <> 'completed' 
        AND due_date >= CURRENT_DATE 
        AND due_date <= (CURRENT_DATE + INTERVAL '7 days')
    ),
    'approved_proposals_count', (
      SELECT COUNT(*)::INT 
      FROM public.proposals 
      WHERE organization_id = v_org_id 
        AND status = 'approved'
    ),
    'approved_proposals_val_inr', (
      SELECT COALESCE(SUM(final_price_inr), 0) 
      FROM public.proposals 
      WHERE organization_id = v_org_id 
        AND status = 'approved'
    ),
    'generated_at', NOW()
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. Stored Function: get_stage_distribution_metrics
-- Returns aggregated deal counts and values grouped by opportunity stage.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_stage_distribution_metrics(target_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  stage TEXT,
  deal_count BIGINT,
  total_value_inr NUMERIC,
  avg_probability NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := COALESCE(target_org_id, public.get_current_org_id());

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization context missing or unauthenticated';
  END IF;

  RETURN QUERY
  SELECT 
    o.stage::TEXT,
    COUNT(o.id)::BIGINT AS deal_count,
    COALESCE(SUM(o.deal_value_inr), 0)::NUMERIC AS total_value_inr,
    ROUND(AVG(o.probability), 1)::NUMERIC AS avg_probability
  FROM public.opportunities o
  WHERE o.organization_id = v_org_id 
    AND o.deleted_at IS NULL
  GROUP BY o.stage
  ORDER BY total_value_inr DESC;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. Stored Function: get_team_performance_metrics
-- Returns aggregated team member metrics (active deals, won deals, revenue).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_team_performance_metrics(target_org_id UUID DEFAULT NULL)
RETURNS TABLE (
  profile_id UUID,
  full_name TEXT,
  email TEXT,
  role TEXT,
  team_name TEXT,
  active_deals BIGINT,
  pipeline_value_inr NUMERIC,
  won_deals BIGINT,
  won_revenue_inr NUMERIC,
  completed_activities BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  v_org_id := COALESCE(target_org_id, public.get_current_org_id());

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Organization context missing or unauthenticated';
  END IF;

  RETURN QUERY
  SELECT 
    p.id AS profile_id,
    p.full_name,
    p.email,
    p.role::TEXT,
    COALESCE(t.name, 'Unassigned')::TEXT AS team_name,
    COUNT(o.id) FILTER (WHERE o.status NOT IN ('won', 'lost') AND o.deleted_at IS NULL)::BIGINT AS active_deals,
    COALESCE(SUM(o.deal_value_inr) FILTER (WHERE o.status NOT IN ('won', 'lost') AND o.deleted_at IS NULL), 0)::NUMERIC AS pipeline_value_inr,
    COUNT(o.id) FILTER (WHERE o.status = 'won' AND o.deleted_at IS NULL)::BIGINT AS won_deals,
    COALESCE(SUM(o.deal_value_inr) FILTER (WHERE o.status = 'won' AND o.deleted_at IS NULL), 0)::NUMERIC AS won_revenue_inr,
    (
      SELECT COUNT(*)::BIGINT 
      FROM public.activities a 
      WHERE a.performed_by = p.id AND a.organization_id = v_org_id
    ) AS completed_activities
  FROM public.profiles p
  LEFT JOIN public.teams t ON p.team_id = t.id
  LEFT JOIN public.opportunities o ON o.owner_id = p.id AND o.organization_id = v_org_id
  WHERE p.organization_id = v_org_id 
    AND p.status = 'active'
  GROUP BY p.id, p.full_name, p.email, p.role, t.name
  ORDER BY won_revenue_inr DESC, pipeline_value_inr DESC;
END;
$$;
