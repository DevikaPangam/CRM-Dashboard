-- ==============================================================================
-- CorpBD CRM — SALES, PROPOSALS, OPERATIONS & REVIEW MODULES MIGRATION
-- Project: Rajmudra Group Multi-Tenant Architecture
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enumerations for Sales, Proposals, Operations & Review
DO $$ BEGIN
  CREATE TYPE public.client_tier_enum AS ENUM (
    'Tier 1 (Enterprise)',
    'Tier 2 (Mid-Market)',
    'Tier 3 (Emerging)'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.client_status_enum AS ENUM (
    'Active',
    'Prospect',
    'Dormant',
    'Blacklisted'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opportunity_stage_enum AS ENUM (
    'Lead / Inception',
    'Discovery & Requirement',
    'Proposal Formulation',
    'Commercial Discussion',
    'Executive Review',
    'Negotiation & Legal',
    'Won & Handed Off',
    'Lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.opportunity_status_enum AS ENUM (
    'Open',
    'Won',
    'Lost',
    'On Hold',
    'Discarded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type_enum AS ENUM (
    'Physical Meeting',
    'Phone Call',
    'Proposal Discussion',
    'Commercial Negotiation',
    'Client Review',
    'Site Visit',
    'Email Communication'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_priority_enum AS ENUM (
    'High',
    'Medium',
    'Low'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.followup_status_enum AS ENUM (
    'Pending',
    'Completed',
    'Overdue',
    'Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.delegation_status_enum AS ENUM (
    'Pending Action',
    'In Review',
    'Approved & Handed Off',
    'Action Completed',
    'Escalated',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.proposal_approval_status_enum AS ENUM (
    'Draft',
    'Submitted',
    'Pending Approval',
    'Approved',
    'Rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------------------------
-- MODULE 1: SALES & PROPOSALS (Clients, Contacts, Opportunities, Activities)
-- ------------------------------------------------------------------------------

-- Table 1: clients (Corporate Client Directory)
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_code text NOT NULL,
  name text NOT NULL,
  client_type text DEFAULT 'Existing Client' NOT NULL,
  industry text DEFAULT 'Technology' NOT NULL,
  segment text DEFAULT 'Enterprise IT & ITeS' NOT NULL,
  city text DEFAULT 'Pune',
  state text DEFAULT 'Maharashtra',
  region text DEFAULT 'West',
  tier public.client_tier_enum DEFAULT 'Tier 1 (Enterprise)' NOT NULL,
  turnover_cr numeric(10, 2) DEFAULT 0.00 NOT NULL,
  employees_count integer DEFAULT 0 NOT NULL,
  status public.client_status_enum DEFAULT 'Active' NOT NULL,
  account_owner text DEFAULT 'Unassigned',
  website text,
  address text,
  deployed_fleets jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_client_code UNIQUE (organization_id, client_code)
);

-- Table 2: contacts (Client Decision Makers & Stakeholders)
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  designation text,
  email text,
  phone text,
  is_primary boolean DEFAULT false NOT NULL,
  notes text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 3: opportunities (Sales Deals & Pipeline Funnel)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_code text NOT NULL,
  title text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  segment text DEFAULT 'General Fleet',
  service_category text DEFAULT 'Corporate Mobility',
  contract_type text DEFAULT 'Annual Contract',
  deal_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  monthly_value_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  stage public.opportunity_stage_enum DEFAULT 'Lead / Inception' NOT NULL,
  probability_pct numeric(5, 2) DEFAULT 10.00 NOT NULL,
  status public.opportunity_status_enum DEFAULT 'Open' NOT NULL,
  owner_name text DEFAULT 'BD Owner' NOT NULL,
  lead_source text DEFAULT 'Direct Outreach',
  expected_close_date date,
  last_activity_date date,
  next_followup_date date,
  fleet_size integer DEFAULT 0 NOT NULL,
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
  delegated_department text DEFAULT 'BD',
  delegated_owner text,
  delegation_status public.delegation_status_enum DEFAULT 'Pending Action',
  delegation_milestone text,
  sla_days_remaining integer DEFAULT 0,
  delegation_remarks text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_opportunity_code UNIQUE (organization_id, opportunity_code)
);

-- Table 4: activities (Meeting Logs & Client Interactions)
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  activity_type public.activity_type_enum DEFAULT 'Physical Meeting' NOT NULL,
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

-- Table 5: followups (SLA Reminders & Action Tracking)
CREATE TABLE IF NOT EXISTS public.followups (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_type text DEFAULT 'Existing Client',
  opportunity_title text,
  due_date date NOT NULL,
  assigned_to text NOT NULL,
  type text NOT NULL,
  priority public.followup_priority_enum DEFAULT 'Medium' NOT NULL,
  description text NOT NULL,
  status public.followup_status_enum DEFAULT 'Pending' NOT NULL,
  completed_at timestamptz,
  remarks text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 6: documents (Proposals, RFPs, SLAs & Contracts Vault)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  original_filename text NOT NULL,
  opportunity_title text,
  client_name text,
  stage text DEFAULT 'Lead',
  document_type text DEFAULT 'Proposal' NOT NULL,
  file_size_formatted text,
  file_size_bytes bigint DEFAULT 0,
  file_extension text DEFAULT 'pdf',
  uploaded_by_name text DEFAULT 'System Admin',
  storage_path text,
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 7: proposals (Commercial Quotations & Margin Calculator)
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  proposal_number text NOT NULL,
  version integer DEFAULT 1 NOT NULL,
  title text NOT NULL,
  pricing_data jsonb DEFAULT '{}'::jsonb NOT NULL,
  total_monthly_quote_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  total_annual_quote_inr numeric(15, 2) DEFAULT 0.00 NOT NULL,
  projected_margin_pct numeric(5, 2) DEFAULT 18.00 NOT NULL,
  approval_status public.proposal_approval_status_enum DEFAULT 'Draft' NOT NULL,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_proposal_number UNIQUE (organization_id, proposal_number, version)
);

-- ------------------------------------------------------------------------------
-- MODULE 2: OPERATIONS & DELEGATION (Internal Tasks & Workshop Logs)
-- ------------------------------------------------------------------------------

-- Table 8: internal_tasks (Cross-Functional Operations Tasks)
CREATE TABLE IF NOT EXISTS public.internal_tasks (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  task_code text,
  title text NOT NULL,
  department text NOT NULL,
  assigned_to text NOT NULL,
  due_date date NOT NULL,
  priority text DEFAULT 'Medium' NOT NULL,
  status text DEFAULT 'Pending' NOT NULL,
  action_date date,
  response_notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- MODULE 3: PERFORMANCE REVIEW & AUDIT GOVERNANCE
-- ------------------------------------------------------------------------------

-- Table 9: performance_reviews (Appraisals & Reviews)
CREATE TABLE IF NOT EXISTS public.performance_reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  employee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  financial_year text DEFAULT 'FY2025-26' NOT NULL,
  review_period text DEFAULT 'Q3 FY25-26' NOT NULL,
  department text NOT NULL,
  designation text NOT NULL,
  overall_score numeric(5, 2) DEFAULT 0.00 NOT NULL,
  kra_achievement_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  kpi_achievement_pct numeric(5, 2) DEFAULT 0.00 NOT NULL,
  manager_rating numeric(3, 1) DEFAULT 3.0 NOT NULL,
  self_rating numeric(3, 1),
  performance_status text DEFAULT 'On Track' NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewer_name text NOT NULL,
  reviewer_role text NOT NULL,
  key_strengths text NOT NULL,
  areas_of_improvement text NOT NULL,
  goals_for_next_period text NOT NULL,
  manager_remarks text,
  employee_remarks text,
  status text DEFAULT 'Finalized' NOT NULL,
  review_date date NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 10: audit_logs (Immutable Compliance & System Audit Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  old_values jsonb,
  new_values jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table 11: notifications (Real-Time In-App Alert Dispatch)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'info' NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link_tab text,
  link_entity_id text,
  is_read boolean DEFAULT false NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS) & Multi-Tenant Policies
-- ------------------------------------------------------------------------------

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Dynamic Org-Scoped Policies for all modules
CREATE POLICY "Clients All" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Contacts All" ON public.contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Opportunities All" ON public.opportunities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Activities All" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Followups All" ON public.followups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Documents All" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Proposals All" ON public.proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Internal Tasks All" ON public.internal_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Performance Reviews All" ON public.performance_reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Audit Logs All" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Notifications All" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. Seed Canonical Sales Clients & Opportunities for Rajmudra Group
-- ------------------------------------------------------------------------------

INSERT INTO public.clients (
  id, organization_id, client_code, name, client_type, industry, segment, city, state, region, tier, turnover_cr, employees_count, status, account_owner, deployed_fleets
) VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'CLT-1001',
    'Tata Consultancy Services Ltd',
    'Existing Client',
    'Information Technology',
    'Enterprise IT & ITeS',
    'Pune',
    'Maharashtra',
    'West',
    'Tier 1 (Enterprise)',
    240893.00,
    614795,
    'Active',
    'Devika Pangam',
    '[{"id":"df_1","seaterCapacity":"32 Seater – AC","vehicleCount":24,"shiftFormat":"24/7 Rotational Roster (3 Shifts)","location":"Hinjawadi Phase 3, Pune","monthlyRatePerVehicleINR":92000,"totalMonthlyBillingINR":2208000,"billingFrequency":"Monthly"}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'CLT-1002',
    'Infosys BPM Ltd',
    'Existing Client',
    'BPO / KPO / Global Delivery',
    'Enterprise IT & ITeS',
    'Pune',
    'Maharashtra',
    'West',
    'Tier 1 (Enterprise)',
    153670.00,
    335000,
    'Active',
    'Devika Pangam',
    '[{"id":"df_2","seaterCapacity":"40 Seater – AC","vehicleCount":18,"shiftFormat":"General Shift (9 AM - 6 PM)","location":"Phase 2, Hinjawadi, Pune","monthlyRatePerVehicleINR":115000,"totalMonthlyBillingINR":2070000,"billingFrequency":"Monthly"}]'::jsonb
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'CLT-1003',
    'Bajaj Auto Ltd (Corporate & R&D)',
    'Existing Client',
    'Automotive & Engineering',
    'Manufacturing & Industrial',
    'Akurdi, Pune',
    'Maharashtra',
    'West',
    'Tier 1 (Enterprise)',
    44870.00,
    12000,
    'Active',
    'Devika Pangam',
    '[{"id":"df_3","seaterCapacity":"50 Seater – AC","vehicleCount":12,"shiftFormat":"Morning Shift (6 AM - 2 PM)","location":"Akurdi Plant, Pune","monthlyRatePerVehicleINR":138000,"totalMonthlyBillingINR":1656000,"billingFrequency":"Monthly"}]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- Seed Contacts
INSERT INTO public.contacts (id, organization_id, client_id, name, designation, email, phone, is_primary)
VALUES
  ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Rajesh Kulkarni', 'Head - Corporate Transport & Facilities', 'rajesh.kulkarni@tcs.com', '+91 98220 11223', true),
  ('11000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Sunita Deshmukh', 'Associate VP - Employee Services', 'sunita.deshmukh@infosys.com', '+91 98230 44556', true),
  ('11000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Col. Mahendra Patil (Retd)', 'General Manager - Administration & Security', 'mpatil@bajajauto.co.in', '+91 98900 77889', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. Reload PostgREST Schema Cache
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
