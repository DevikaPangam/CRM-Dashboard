-- ==============================================================================
-- CorpBD CRM — LEADS, OPPORTUNITY PIPELINE & DELEGATION MATRIX MIGRATION
-- Project: Rajmudra Group Multi-Tenant Architecture
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Ensure Extension for UUID Generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Primary Organization Exists
INSERT INTO public.organizations (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rajmudra Corporate Fleet Solutions Ltd',
  'rajmudra-fleet'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Table: opportunities (Leads, Deal Pipeline & Delegation Matrix)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_code text NOT NULL,
  title text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  segment text DEFAULT 'Employee Transportation' NOT NULL,
  service_category text DEFAULT 'Corporate Mobility',
  contract_type text DEFAULT 'Annual Contract',
  deal_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL CHECK (deal_value_inr >= 0),
  monthly_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL CHECK (monthly_value_inr >= 0),
  stage text DEFAULT 'Lead / Inception' NOT NULL,
  probability_pct numeric(5, 2) DEFAULT 10.00 NOT NULL CHECK (probability_pct >= 0 AND probability_pct <= 100),
  status text DEFAULT 'Open' NOT NULL,
  owner_name text DEFAULT 'BD Owner' NOT NULL,
  lead_source text DEFAULT 'Direct Outreach',
  expected_close_date date,
  last_activity_date date,
  next_followup_date date,
  fleet_size integer DEFAULT 0 CHECK (fleet_size >= 0),
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
  
  -- Delegation Matrix Handoff Fields
  delegated_department text DEFAULT 'Operations',
  delegated_owner text DEFAULT 'Manish Rawat (VP - Ops)',
  delegation_status text DEFAULT 'Pending Action',
  delegation_milestone text,
  sla_days_remaining integer DEFAULT 0,
  delegation_remarks text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_opportunity_code UNIQUE (organization_id, opportunity_code)
);

-- 4. Table: internal_tasks (Cross-Functional Department Delegation & Action Matrix)
CREATE TABLE IF NOT EXISTS public.internal_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
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
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table: activities (Meeting Logs, Client Engagements & Handoff Logs)
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  activity_type text DEFAULT 'Physical Meeting' NOT NULL,
  activity_date date NOT NULL,
  activity_time text,
  conducted_by text NOT NULL,
  contact_person text NOT NULL,
  location text,
  key_discussion text NOT NULL,
  outcome text NOT NULL,
  action_items text NOT NULL,
  next_followup_date date,
  status text DEFAULT 'Completed' NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table: followups (SLA Tracking & Next Action Reminders)
CREATE TABLE IF NOT EXISTS public.followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  due_date date NOT NULL,
  assigned_to text NOT NULL,
  followup_type text DEFAULT 'Call' NOT NULL,
  priority text DEFAULT 'Medium' NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  completed_at timestamptz,
  remarks text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Automated updated_at Triggers
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opportunities_set_updated_at ON public.opportunities;
CREATE TRIGGER opportunities_set_updated_at
BEFORE UPDATE ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_column();

DROP TRIGGER IF EXISTS internal_tasks_set_updated_at ON public.internal_tasks;
CREATE TRIGGER internal_tasks_set_updated_at
BEFORE UPDATE ON public.internal_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_column();

-- 8. Enable Row Level Security (RLS) with Tenant Isolation
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Opportunities Tenant Isolation" ON public.opportunities;
DROP POLICY IF EXISTS "Internal Tasks Tenant Isolation" ON public.internal_tasks;
DROP POLICY IF EXISTS "Activities Tenant Isolation" ON public.activities;
DROP POLICY IF EXISTS "Followups Tenant Isolation" ON public.followups;

CREATE POLICY "Opportunities Tenant Isolation" ON public.opportunities
FOR ALL
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
)
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
);

CREATE POLICY "Internal Tasks Tenant Isolation" ON public.internal_tasks
FOR ALL
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
)
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
);

CREATE POLICY "Activities Tenant Isolation" ON public.activities
FOR ALL
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
)
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
);

CREATE POLICY "Followups Tenant Isolation" ON public.followups
FOR ALL
USING (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
)
WITH CHECK (
  organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR auth.uid() IS NULL
);

-- 9. Seed Canonical Initial Opportunities with Delegation Matrix
INSERT INTO public.opportunities (
  organization_id, opportunity_code, title, client_id, client_name, client_type, segment, service_category,
  deal_value_inr, monthly_value_inr, stage, probability_pct, status, owner_name, lead_source, fleet_size,
  delegated_department, delegated_owner, delegation_status, delegation_milestone, sla_days_remaining, delegation_remarks
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'OPP-001',
    'TCS Hinjawadi Phase-3 Bus Fleet Expansion',
    (SELECT id FROM public.clients WHERE client_code = 'CLT-1001' LIMIT 1),
    'Tata Consultancy Services Ltd',
    'Existing Client',
    'Employee Transportation',
    'Corporate Mobility',
    18000000.00,
    1500000.00,
    'Proposal Formulation',
    70.00,
    'Open',
    'Aditya Patil',
    'Direct Outreach',
    15,
    'Operations',
    'Manish Rawat (VP - Ops)',
    'Approved & Handed Off',
    'Route survey & vehicle turnaround feasibility cleared for 15 buses',
    4,
    'Initial technical feasibility approved by Central Ops.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'OPP-002',
    'Infosys BPM Dedicated Night Shift Fleet',
    (SELECT id FROM public.clients WHERE client_code = 'CLT-1002' LIMIT 1),
    'Infosys BPM Ltd',
    'Existing Client',
    'Employee Transportation',
    'Corporate Mobility',
    12500000.00,
    1041666.00,
    'Commercial Discussion',
    80.00,
    'Open',
    'Priya Sharma',
    'Referral / Existing Client',
    10,
    'Pricing & Commercials',
    'Sunil Mehta (CFO)',
    'In Review',
    'Discount margin calculation & gross profit threshold sign-off',
    2,
    'Commercial annexure under review with finance team.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'OPP-003',
    'Bajaj Auto Plant Inter-Facility Shuttle',
    (SELECT id FROM public.clients WHERE client_code = 'CLT-1003' LIMIT 1),
    'Bajaj Auto Ltd (Corporate & R&D)',
    'Existing Client',
    'Fleet Management',
    'Enterprise Fleet',
    22000000.00,
    1833333.00,
    'Executive Review',
    90.00,
    'Open',
    'Rahul Verma',
    'Inbound Tender / RFP',
    18,
    'Management',
    'Devika Pangam (COO/Admin)',
    'Approved & Handed Off',
    'Executive Board approval on strategic enterprise fleet terms',
    1,
    'Management approval granted.'
  )
ON CONFLICT (organization_id, opportunity_code) DO UPDATE SET
  title = EXCLUDED.title,
  deal_value_inr = EXCLUDED.deal_value_inr,
  monthly_value_inr = EXCLUDED.monthly_value_inr,
  stage = EXCLUDED.stage,
  probability_pct = EXCLUDED.probability_pct,
  status = EXCLUDED.status,
  owner_name = EXCLUDED.owner_name,
  delegated_department = EXCLUDED.delegated_department,
  delegated_owner = EXCLUDED.delegated_owner,
  delegation_status = EXCLUDED.delegation_status,
  delegation_milestone = EXCLUDED.delegation_milestone,
  sla_days_remaining = EXCLUDED.sla_days_remaining,
  delegation_remarks = EXCLUDED.delegation_remarks;

-- 10. Seed Initial Operations Delegation Tasks
INSERT INTO public.internal_tasks (
  organization_id, task_code, title, department, assigned_to, assigned_by, due_date, priority, status, request_details
) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    'TASK-001',
    'TCS Route Survey & Depot Allocation',
    'Operations',
    'Manish Rawat (VP - Ops)',
    'Aditya Patil',
    '2026-09-15',
    'High',
    'In Progress',
    'Conduct Hinjawadi Phase-3 depot turnaround analysis and driver allocation.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'TASK-002',
    'Infosys Night Shift Pricing Annexure Review',
    'Pricing & Commercials',
    'Sunil Mehta (CFO)',
    'Priya Sharma',
    '2026-09-14',
    'High',
    'Pending',
    'Validate gross margin thresholds for 10 dedicated night shift Tempo Travellers.'
  )
ON CONFLICT DO NOTHING;

-- 11. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
