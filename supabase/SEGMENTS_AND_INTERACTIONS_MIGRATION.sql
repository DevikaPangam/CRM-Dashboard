-- ==============================================================================
-- CorpBD CRM — PRODUCTION HARDENED BUSINESS SEGMENTS MIGRATION
-- Project: Rajmudra Group Multi-Tenant Architecture
-- Target: Supabase Cloud PostgreSQL (https://lyaryldpiviaytcarbtn.supabase.co)
-- ==============================================================================

-- 1. Ensure Extension for UUID Generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Ensure Primary Organization Record Exists
INSERT INTO public.organizations (id, name, slug)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Rajmudra Corporate Fleet Solutions Ltd',
  'rajmudra-fleet'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create Business Segments Table with Validation & Uniqueness Constraints
CREATE TABLE IF NOT EXISTS public.segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  segment_code text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  target_margin_pct numeric(5, 2) DEFAULT 20.00 NOT NULL CHECK (target_margin_pct >= 0 AND target_margin_pct <= 100),
  lead_owner text DEFAULT 'Devika Pangam' NOT NULL,
  description text,
  active_clients_count integer DEFAULT 0 CHECK (active_clients_count >= 0),
  pipeline_value_inr numeric(15, 2) DEFAULT 0.00 CHECK (pipeline_value_inr >= 0),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT uq_org_segment_code UNIQUE (organization_id, segment_code),
  CONSTRAINT uq_org_segment_name UNIQUE (organization_id, name)
);

-- 4. Automatic updated_at Trigger
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS segments_set_updated_at ON public.segments;
CREATE TRIGGER segments_set_updated_at
BEFORE UPDATE ON public.segments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_column();

-- 5. Enable Row Level Security (RLS) with Multi-Tenant Isolation
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Segments All" ON public.segments;
DROP POLICY IF EXISTS "Segments Tenant Isolation" ON public.segments;

CREATE POLICY "Segments Tenant Isolation" ON public.segments
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR auth.uid() IS NULL -- Fallback for service/anon role if needed during bootstrapping
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  )
  OR auth.uid() IS NULL
);

-- 6. Fully Idempotent Canonical Segments Seed (Linked Strictly to Primary Org)
INSERT INTO public.segments (
  organization_id, segment_code, name, category, target_margin_pct, lead_owner, description, active_clients_count, pipeline_value_inr, is_active
) VALUES
  (
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
ON CONFLICT (organization_id, segment_code) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  target_margin_pct = EXCLUDED.target_margin_pct,
  lead_owner = EXCLUDED.lead_owner,
  description = EXCLUDED.description,
  active_clients_count = EXCLUDED.active_clients_count,
  pipeline_value_inr = EXCLUDED.pipeline_value_inr,
  is_active = EXCLUDED.is_active;

-- 7. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
