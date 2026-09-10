-- ==============================================================================
-- CorpBD CRM — Migration: 20260910000012_employee_kra_kpi_foundation.sql
-- Description: Multi-Department KRA & KPI Data Architecture
--              Supports: Business Development, Operations, Centralised Operations,
--              Maintenance, Finance, and Legal with specialized calculation rules.
-- Organization: Rajmudra Group Multi-Tenant Architecture
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Create Enums for KPI Types & Statuses
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.kpi_type_enum AS ENUM (
    'higher_is_better',
    'lower_is_better',
    'target_range',
    'percentage',
    'numeric',
    'currency',
    'count',
    'boolean_completion'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kpi_status_enum AS ENUM (
    'Exceeded',
    'On Track',
    'Needs Improvement',
    'At Risk',
    'Finalized'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLE 1: kra_definitions (Organizational / Department Templates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kra_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  department text NOT NULL,
  role_designation text,
  category text NOT NULL,
  name text NOT NULL,
  description text,
  default_weightage_pct numeric(5, 2) DEFAULT 25.00 NOT NULL,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 3. TABLE 2: employee_kras (Assigned Employee Key Result Areas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_kras (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  kra_definition_id uuid REFERENCES public.kra_definitions(id) ON DELETE SET NULL,
  department text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  weightage_pct numeric(5, 2) DEFAULT 25.00 NOT NULL,
  score_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  status public.kpi_status_enum DEFAULT 'On Track' NOT NULL,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  review_period text DEFAULT 'Annual FY26-27' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. TABLE 3: kpi_definitions (Organizational KPI Templates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kpi_definitions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  kra_definition_id uuid REFERENCES public.kra_definitions(id) ON DELETE CASCADE,
  department text NOT NULL,
  name text NOT NULL,
  description text,
  kpi_type public.kpi_type_enum DEFAULT 'higher_is_better' NOT NULL,
  unit text DEFAULT '%' NOT NULL,
  default_target_value numeric(15, 2) DEFAULT 100.00 NOT NULL,
  target_range_min numeric(15, 2),
  target_range_max numeric(15, 2),
  default_weightage_pct numeric(5, 2) DEFAULT 10.00 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 5. TABLE 4: employee_kpis (Individual Employee KPI Targets & Actuals)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_kpis (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  employee_kra_id uuid REFERENCES public.employee_kras(id) ON DELETE CASCADE NOT NULL,
  kpi_definition_id uuid REFERENCES public.kpi_definitions(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  kpi_type public.kpi_type_enum DEFAULT 'higher_is_better' NOT NULL,
  unit text DEFAULT '%' NOT NULL,
  target_value numeric(15, 2) DEFAULT 100.00 NOT NULL,
  actual_value numeric(15, 2) DEFAULT 0.00 NOT NULL,
  target_range_min numeric(15, 2),
  target_range_max numeric(15, 2),
  target_display text,
  actual_display text,
  weightage_pct numeric(5, 2) DEFAULT 10.00 NOT NULL,
  achievement_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  score numeric(5, 2) DEFAULT 0.00 NOT NULL,
  status public.kpi_status_enum DEFAULT 'On Track' NOT NULL,
  manager_comment text,
  employee_comment text,
  financial_year text DEFAULT 'FY2026-27' NOT NULL,
  review_period text DEFAULT 'Annual FY26-27' NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 6. Updated_at Triggers
-- ------------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_kra_definitions ON public.kra_definitions;
CREATE TRIGGER set_updated_at_kra_definitions
  BEFORE UPDATE ON public.kra_definitions
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_employee_kras ON public.employee_kras;
CREATE TRIGGER set_updated_at_employee_kras
  BEFORE UPDATE ON public.employee_kras
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_kpi_definitions ON public.kpi_definitions;
CREATE TRIGGER set_updated_at_kpi_definitions
  BEFORE UPDATE ON public.kpi_definitions
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_employee_kpis ON public.employee_kpis;
CREATE TRIGGER set_updated_at_employee_kpis
  BEFORE UPDATE ON public.employee_kpis
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.kra_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpis ENABLE ROW LEVEL SECURITY;

-- KRA Definitions RLS
DROP POLICY IF EXISTS "KRA Definitions Select" ON public.kra_definitions;
CREATE POLICY "KRA Definitions Select"
  ON public.kra_definitions FOR SELECT
  USING (organization_id = public.get_current_org_id());

DROP POLICY IF EXISTS "KRA Definitions Admin Write" ON public.kra_definitions;
CREATE POLICY "KRA Definitions Admin Write"
  ON public.kra_definitions FOR ALL
  USING (organization_id = public.get_current_org_id() AND public.is_org_admin())
  WITH CHECK (organization_id = public.get_current_org_id() AND public.is_org_admin());

-- Employee KRAs RLS
DROP POLICY IF EXISTS "Employee KRAs Select" ON public.employee_kras;
CREATE POLICY "Employee KRAs Select"
  ON public.employee_kras FOR SELECT
  USING (
    organization_id = public.get_current_org_id()
    AND (
      employee_id = auth.uid()
      OR public.is_manager_of(employee_id)
      OR public.is_org_admin()
    )
  );

DROP POLICY IF EXISTS "Employee KRAs Write" ON public.employee_kras;
CREATE POLICY "Employee KRAs Write"
  ON public.employee_kras FOR ALL
  USING (
    organization_id = public.get_current_org_id()
    AND (public.is_manager_of(employee_id) OR public.is_org_admin())
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND (public.is_manager_of(employee_id) OR public.is_org_admin())
  );

-- KPI Definitions RLS
DROP POLICY IF EXISTS "KPI Definitions Select" ON public.kpi_definitions;
CREATE POLICY "KPI Definitions Select"
  ON public.kpi_definitions FOR SELECT
  USING (organization_id = public.get_current_org_id());

DROP POLICY IF EXISTS "KPI Definitions Admin Write" ON public.kpi_definitions;
CREATE POLICY "KPI Definitions Admin Write"
  ON public.kpi_definitions FOR ALL
  USING (organization_id = public.get_current_org_id() AND public.is_org_admin())
  WITH CHECK (organization_id = public.get_current_org_id() AND public.is_org_admin());

-- Employee KPIs RLS
DROP POLICY IF EXISTS "Employee KPIs Select" ON public.employee_kpis;
CREATE POLICY "Employee KPIs Select"
  ON public.employee_kpis FOR SELECT
  USING (
    organization_id = public.get_current_org_id()
    AND (
      employee_id = auth.uid()
      OR public.is_manager_of(employee_id)
      OR public.is_org_admin()
    )
  );

DROP POLICY IF EXISTS "Employee KPIs Write" ON public.employee_kpis;
CREATE POLICY "Employee KPIs Write"
  ON public.employee_kpis FOR ALL
  USING (
    organization_id = public.get_current_org_id()
    AND (
      employee_id = auth.uid() -- Employee can submit self-comment
      OR public.is_manager_of(employee_id)
      OR public.is_org_admin()
    )
  )
  WITH CHECK (
    organization_id = public.get_current_org_id()
    AND (
      employee_id = auth.uid()
      OR public.is_manager_of(employee_id)
      OR public.is_org_admin()
    )
  );

-- ------------------------------------------------------------------------------
-- 8. Indexes for High-Performance Scorecard Lookups
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employee_kras_emp ON public.employee_kras(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kras_dept ON public.employee_kras(department);
CREATE INDEX IF NOT EXISTS idx_employee_kras_fy ON public.employee_kras(financial_year, review_period);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_kra ON public.employee_kpis(employee_kra_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_emp ON public.employee_kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpis_status ON public.employee_kpis(status);

-- ------------------------------------------------------------------------------
-- 9. Seed Canonical Department KRA & KPI Templates for Rajmudra Group
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
BEGIN
  -- 1. Business Development Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000001'::uuid, v_org_id, v_dept_bd, 'Business Development', 'New Business & Revenue', 'Enterprise Revenue & Quota Attainment', 'Achieve designated annual contract value targets for staff transportation and corporate fleet leases.', 35.00),
    ('40000000-0000-0000-0000-000000000002'::uuid, v_org_id, v_dept_bd, 'Business Development', 'Client Acquisition & Expansion', 'Key Account Acquisition & Fleet Roster Growth', 'Drive new enterprise logos, contract conversions, and fleet vehicle expansion.', 25.00),
    ('40000000-0000-0000-0000-000000000003'::uuid, v_org_id, v_dept_bd, 'Business Development', 'Pipeline Health & Velocity', 'Pipeline Generation & Multi-Stage Deal Progression', 'Maintain healthy 3x qualified pipeline coverage with rapid deal velocity.', 20.00),
    ('40000000-0000-0000-0000-000000000004'::uuid, v_org_id, v_dept_bd, 'Business Development', 'CRM Hygiene & Compliance', 'Client Engagement & Interaction SLA Adherence', 'Timely logging of meetings, proposals, client reviews, and zero overdue tasks.', 20.00)
  ON CONFLICT DO NOTHING;

  -- 2. Operations Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000005'::uuid, v_org_id, v_dept_ops, 'Operations', 'Operational Efficiency', 'Trip Execution & Punctuality SLA Compliance', 'Ensure employee pickup/drop trips execute within SLA with 98%+ on-time punctuality.', 35.00),
    ('40000000-0000-0000-0000-000000000006'::uuid, v_org_id, v_dept_ops, 'Operations', 'Cost Control', 'Fuel & Fleet Running Cost Efficiency', 'Optimize vehicle routing, minimize empty kilometers, and enforce fuel mileage benchmarks.', 25.00),
    ('40000000-0000-0000-0000-000000000007'::uuid, v_org_id, v_dept_ops, 'Operations', 'Driver Management', 'Driver Roster & Shift Adherence', 'Maintain high driver availability, zero unexcused shift absences, and hygiene compliance.', 20.00),
    ('40000000-0000-0000-0000-000000000008'::uuid, v_org_id, v_dept_ops, 'Operations', 'Client Satisfaction', 'Client Service Ratings & Incident Management', 'Maintain 4.7+ client ride satisfaction rating and rapid dispute resolution.', 20.00)
  ON CONFLICT DO NOTHING;

  -- 3. Centralised Operations Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000009'::uuid, v_org_id, v_dept_cop, 'Centralised Operations', 'Command Center Operations', '24/7 Telematics & GPS Live Fleet Uptime', 'Maintain continuous telematics connectivity and real-time pan-India tracking uptime.', 35.00),
    ('40000000-0000-0000-0000-000000000010'::uuid, v_org_id, v_dept_cop, 'Centralised Operations', 'Incident Response & Safety', 'Emergency SOS & Breakdown Incident Response Time', 'Resolve critical SOS, driver duress, and breakdown alerts within strict 5-minute SLA.', 30.00),
    ('40000000-0000-0000-0000-000000000011'::uuid, v_org_id, v_dept_cop, 'Centralised Operations', 'Route Control', 'Geofence & Over-Speeding Violation Control', 'Detect and escalate route deviations, unauthorized stops, and speed violations.', 20.00),
    ('40000000-0000-0000-0000-000000000012'::uuid, v_org_id, v_dept_cop, 'Centralised Operations', 'Process Efficiency', 'Client Dispatch Audit & MIS Delivery Timelines', 'Deliver daily automated client MIS trip reports before 07:00 AM without error.', 15.00)
  ON CONFLICT DO NOTHING;

  -- 4. Maintenance Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000013'::uuid, v_org_id, v_dept_mnt, 'Maintenance', 'Preventive Maintenance', 'PMS Schedule Adherence & Depot Servicing', 'Execute 100% scheduled oil changes, brake inspections, and preventive checks on time.', 35.00),
    ('40000000-0000-0000-0000-000000000014'::uuid, v_org_id, v_dept_mnt, 'Maintenance', 'Reliability & Availability', 'On-Road Breakdown Rate Reduction', 'Minimize fleet breakdown incidents to less than 0.2 breakdowns per 10,000 km.', 30.00),
    ('40000000-0000-0000-0000-000000000015'::uuid, v_org_id, v_dept_mnt, 'Maintenance', 'Workshop Efficiency', 'Mean Time to Repair (MTTR) & Workshop Downtime', 'Reduce average vehicle workshop repair turnaround time to under 4 hours.', 20.00),
    ('40000000-0000-0000-0000-000000000016'::uuid, v_org_id, v_dept_mnt, 'Maintenance', 'Statutory Compliance', 'RTO Vehicle Fitness & PUC Regulatory Compliance', 'Ensure 100% zero-lapse RTO vehicle fitness, PUC, and green tax certifications.', 15.00)
  ON CONFLICT DO NOTHING;

  -- 5. Finance Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000017'::uuid, v_org_id, v_dept_fin, 'Finance', 'Billing & Revenue Realization', 'Monthly Corporate Invoicing Cycle Timelines', 'Complete 100% client monthly billings within 3 working days post month-end.', 35.00),
    ('40000000-0000-0000-0000-000000000018'::uuid, v_org_id, v_dept_fin, 'Finance', 'Credit Control & Cash Flow', 'Days Sales Outstanding (DSO) & Receivables Recovery', 'Maintain DSO below 45 days and recover 98%+ of corporate receivables on time.', 30.00),
    ('40000000-0000-0000-0000-000000000019'::uuid, v_org_id, v_dept_fin, 'Finance', 'Pricing & Margin Governance', 'Commercial Proposal Margin & Cost Card Audit', 'Verify 100% commercial quotations to ensure minimum 18% gross margin compliance.', 20.00),
    ('40000000-0000-0000-0000-000000000020'::uuid, v_org_id, v_dept_fin, 'Finance', 'Statutory & Tax Compliance', 'GST, TDS, and Audit Closure Compliance', 'Zero delay and zero penalty across monthly GST returns, TDS filings, and audits.', 15.00)
  ON CONFLICT DO NOTHING;

  -- 6. Legal Templates
  INSERT INTO public.kra_definitions (id, organization_id, department_id, department, category, name, description, default_weightage_pct)
  VALUES
    ('40000000-0000-0000-0000-000000000021'::uuid, v_org_id, v_dept_leg, 'Legal', 'Contract Execution', 'Master Service Agreement (MSA) Turnaround Time', 'Review, draft, and finalize corporate client MSAs within 48 hours of receipt.', 35.00),
    ('40000000-0000-0000-0000-000000000022'::uuid, v_org_id, v_dept_leg, 'Legal', 'Risk & Regulatory Compliance', 'Transport Permits, Motor Insurance & Legal Audit', 'Ensure 100% motor insurance, interstate transport permits, and labor compliance.', 30.00),
    ('40000000-0000-0000-0000-000000000023'::uuid, v_org_id, v_dept_leg, 'Legal', 'Governance & Confidentiality', 'NDA, Subcontractor Agreements & SLA Governance', 'Maintain 100% signed vendor NDAs, back-to-back agreements, and penalty protection.', 20.00),
    ('40000000-0000-0000-0000-000000000024'::uuid, v_org_id, v_dept_leg, 'Legal', 'Dispute Resolution', 'Commercial Dispute Resolution & Legal Risk Mitigation', 'Resolve client and vendor legal disputes with zero litigation penalties.', 15.00)
  ON CONFLICT DO NOTHING;

END $$;
