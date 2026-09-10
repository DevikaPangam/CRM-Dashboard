-- ==============================================================================
-- CorpBD CRM — BUSINESS SEGMENTS, OPPORTUNITIES & ENGAGEMENT INTERACTIONS MIGRATION
-- Project: Rajmudra Group Multi-Tenant Architecture
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Primary Rajmudra Organization Exists
INSERT INTO public.organizations (id, name, slug, domain, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rajmudra Corporate Fleet Solutions Ltd',
  'rajmudra-fleet',
  'rajmudragroup.com',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Business Segments Table
CREATE TABLE IF NOT EXISTS public.segments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  segment_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  target_margin_pct numeric(5, 2) DEFAULT 20.00 NOT NULL,
  lead_owner text DEFAULT 'Devika Pangam' NOT NULL,
  description text,
  active_clients_count integer DEFAULT 0,
  pipeline_value_inr numeric(15, 2) DEFAULT 0.00,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_segment_name UNIQUE (organization_id, name)
);

-- 4. Enable RLS and Policies for Segments
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Segments All" ON public.segments;
  CREATE POLICY "Segments All" ON public.segments FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Seed Canonical Business Segments for Rajmudra Group (All linked to Organization 00000000-0000-0000-0000-000000000001)
INSERT INTO public.segments (
  id, organization_id, segment_code, name, category, target_margin_pct, lead_owner, description, active_clients_count, pipeline_value_inr, is_active
) VALUES
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'SEG-01',
    'Employee Transportation',
    'Corporate Mobility',
    22.00,
    'Devika Pangam',
    'Corporate employee commute, cab fleet operations, shuttle buses and green EV transport.',
    8,
    42000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'SEG-02',
    'Warehouse Logistics',
    'Supply Chain & 3PL',
    25.00,
    'Devika Pangam',
    'Grade-A dedicated warehousing, multi-client distribution centers, WMS software and inventory management.',
    6,
    58000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'SEG-03',
    'Fleet Management',
    'Enterprise Fleet',
    18.00,
    'Devika Pangam',
    'Enterprise fleet leasing, telematics, maintenance, fuel management and dedicated corporate drivers.',
    5,
    28000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'SEG-04',
    'Contract Logistics',
    'End-to-End 3PL',
    20.00,
    'Devika Pangam',
    'End-to-end 3PL / 4PL long-term contracts, supply chain planning, multimodal transport and packaging.',
    4,
    34000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'SEG-05',
    'Corporate Travel',
    'Executive Mobility',
    28.00,
    'Devika Pangam',
    'Executive VIP travel, airport transfers, corporate event logistics and luxury car rentals.',
    7,
    22000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'SEG-06',
    'Supply Chain Solutions',
    'Consulting & Multimodal',
    24.00,
    'Devika Pangam',
    'Consulting, network optimization, freight forwarding, customs clearance and port handling.',
    5,
    48000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000001',
    'SEG-07',
    'Last Mile Delivery',
    'Urban E-commerce',
    16.00,
    'Devika Pangam',
    'E-commerce intracity delivery, hyper-local courier, dark store dispatches and return logistics.',
    3,
    19000000.00,
    true
  ),
  (
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000001',
    'SEG-08',
    'Cold Chain Logistics',
    'Temperature-Controlled',
    26.00,
    'Devika Pangam',
    'Temperature-controlled reefer trucks, cold storage, perishable pharma & food distribution.',
    4,
    36000000.00,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  target_margin_pct = EXCLUDED.target_margin_pct,
  lead_owner = EXCLUDED.lead_owner,
  description = EXCLUDED.description,
  active_clients_count = EXCLUDED.active_clients_count,
  pipeline_value_inr = EXCLUDED.pipeline_value_inr,
  updated_at = timezone('utc'::text, now());

-- 6. Seed Canonical Initial Opportunities across Segments
INSERT INTO public.opportunities (
  id, organization_id, opportunity_code, title, client_id, client_name, client_type, segment, service_category,
  deal_value_inr, monthly_value_inr, stage, probability_pct, status, owner_name, lead_source, fleet_size
) VALUES
  (
    '30000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'OPP-001',
    'TCS Hinjawadi Phase-3 Bus Fleet Expansion',
    '10000000-0000-0000-0000-000000000001',
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
    15
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'OPP-002',
    'Infosys BPM Dedicated Night Shift Fleet',
    '10000000-0000-0000-0000-000000000002',
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
    10
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'OPP-003',
    'Bajaj Auto Plant Inter-Facility Shuttle',
    '10000000-0000-0000-0000-000000000003',
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
    18
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Seed Initial Engagement Activities across Segments
INSERT INTO public.activities (
  id, organization_id, client_id, opportunity_id, client_name, client_type, opportunity_title,
  activity_type, activity_date, activity_time, conducted_by, contact_person, location, key_discussion, outcome, action_items, status
) VALUES
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    'Tata Consultancy Services Ltd',
    'Existing Client',
    'TCS Hinjawadi Phase-3 Bus Fleet Expansion',
    'Physical Meeting',
    CURRENT_DATE,
    '11:00 AM',
    'Aditya Patil',
    'Rajesh Kulkarni',
    'TCS Sahyadri Park, Hinjawadi Pune',
    'Presented route optimization plan for Phase 3 shift pickups. Client requested 32-seater AC bus options.',
    'Client positively inclined towards proposal; asked for revised commercial annexure.',
    'Submit finalized rate sheet and vehicle specifications by Friday.',
    'Completed'
  ),
  (
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    'Infosys BPM Ltd',
    'Existing Client',
    'Infosys BPM Dedicated Night Shift Fleet',
    'Proposal Discussion',
    CURRENT_DATE,
    '03:30 PM',
    'Priya Sharma',
    'Sunita Deshmukh',
    'Microsoft Teams Conference',
    'Reviewed night transport safety protocols, GPS tracking integration, and female employee escort policies.',
    'Safety compliance cleared by client audit team.',
    'Prepare Master Service Agreement addendum.',
    'Completed'
  )
ON CONFLICT (id) DO NOTHING;

-- 8. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
